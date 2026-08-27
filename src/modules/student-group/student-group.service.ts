import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgMembershipStatus } from '../../common/utils/org-membership.util';
import {
  AddGroupMembersDto,
  CreateStudentGroupDto,
  UpdateStudentGroupDto,
} from './student-group.dto';

@Injectable()
export class StudentGroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertActiveOrgMembership(userId: number) {
    const membership = await this.prisma.institution_Membership.findFirst({
      where: { user_id: userId, status: OrgMembershipStatus.active },
      include: { institution: true },
    });
    if (!membership) {
      throw new BadRequestException('Join or create an organization first');
    }
    return membership;
  }

  async listGroups(userId: number) {
    const membership = await this.assertActiveOrgMembership(userId);
    return this.prisma.student_Group.findMany({
      where: { institution_id: membership.institution_id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email_id: true,
                    student: { select: { id: true } },
                  },
                },
                student: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getGroup(userId: number, groupId: number) {
    const membership = await this.assertActiveOrgMembership(userId);
    const group = await this.prisma.student_Group.findFirst({
      where: { id: groupId, institution_id: membership.institution_id },
      include: {
        members: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email_id: true,
                    student: { select: { id: true } },
                  },
                },
                student: { select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async createGroup(userId: number, dto: CreateStudentGroupDto) {
    const membership = await this.assertActiveOrgMembership(userId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Name is required');

    const existing = await this.prisma.student_Group.findFirst({
      where: { institution_id: membership.institution_id, name },
    });
    if (existing) {
      throw new BadRequestException('A group with this name already exists');
    }

    const group = await this.prisma.student_Group.create({
      data: {
        institution_id: membership.institution_id,
        name,
        description: dto.description?.trim() || null,
        created_by_user_id: userId,
      },
    });

    if (dto.participant_ids?.length) {
      await this.addMembers(userId, group.id, { participant_ids: dto.participant_ids });
    }

    return this.getGroup(userId, group.id);
  }

  async updateGroup(userId: number, groupId: number, dto: UpdateStudentGroupDto) {
    await this.getGroup(userId, groupId);
    const data: { name?: string; description?: string | null } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;

    await this.prisma.student_Group.update({
      where: { id: groupId },
      data,
    });
    return this.getGroup(userId, groupId);
  }

  async deleteGroup(userId: number, groupId: number) {
    await this.getGroup(userId, groupId);
    await this.prisma.student_Group.delete({ where: { id: groupId } });
    return { message: 'Group deleted' };
  }

  async addMembers(userId: number, groupId: number, dto: AddGroupMembersDto) {
    const membership = await this.assertActiveOrgMembership(userId);
    await this.getGroup(userId, groupId);

    const participants = await this.prisma.participant.findMany({
      where: {
        id: { in: dto.participant_ids },
        institution_id: membership.institution_id,
        status: 'active',
      },
    });
    if (!participants.length) {
      throw new BadRequestException('No valid org participants found to add');
    }

    await this.prisma.student_Group_Member.createMany({
      data: participants.map((p) => ({
        student_group_id: groupId,
        participant_id: p.id,
      })),
      skipDuplicates: true,
    });

    return this.getGroup(userId, groupId);
  }

  async removeMember(userId: number, groupId: number, participantId: number) {
    await this.getGroup(userId, groupId);
    await this.prisma.student_Group_Member.deleteMany({
      where: { student_group_id: groupId, participant_id: participantId },
    });
    return this.getGroup(userId, groupId);
  }

  /** Resolve group members to Student.id values for bulk assign. */
  async resolveStudentIdsForGroup(userId: number, groupId: number): Promise<number[]> {
    const group = await this.getGroup(userId, groupId);
    const studentIds = group.members
      .map((m) => m.participant.student?.id ?? m.participant.user?.student?.id)
      .filter((id): id is number => typeof id === 'number');
    return [...new Set(studentIds)];
  }
}
