import { Controller, Get, Put, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my in-app notifications' })
  @ApiQuery({ name: 'unread_only', required: false })
  listMine(@Request() req, @Query('unread_only') unreadOnly?: string) {
    return this.service.listForUser(req.user.id, unreadOnly === 'true' || unreadOnly === '1');
  }

  @Put('me/read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAll(@Request() req) {
    return this.service.markAllRead(req.user.id);
  }

  @Put('me/:id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(req.user.id, id);
  }
}
