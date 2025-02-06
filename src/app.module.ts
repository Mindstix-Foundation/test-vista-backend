import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardModule } from './modules/board/board.module';
import { AddressModule } from './modules/address/address.module';
import { CityModule } from './modules/city/city.module';
import { StateModule } from './modules/state/state.module';
import { CountryModule } from './modules/country/country.module';
import { StandardModule } from './modules/standard/standard.module';
import { SubjectModule } from './modules/subject/subject.module';
import { InstructionMediumModule } from './modules/instruction_medium/instruction-medium.module';
import { SchoolModule } from './modules/school/school.module';
import { SchoolInstructionMediumModule } from './modules/school_instruction_medium/school_instruction_medium.module';
import { SchoolStandardModule } from './modules/school_standard/school_standard.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { UserRoleModule } from './modules/user_role/user-role.module';
import { UserSchoolModule } from './modules/user_school/user-school.module';
import { MediumStandardSubjectModule } from './modules/medium_standard_subject/medium-standard-subject.module';
import { TeacherSubjectModule } from './modules/teacher_subject/teacher-subject.module';

@Module({
  imports: [
    CountryModule,
    StateModule,
    CityModule,
    AddressModule,
    BoardModule,
    StandardModule,
    SubjectModule,
    InstructionMediumModule,
    SchoolModule,
    SchoolInstructionMediumModule,
    SchoolStandardModule,
    UserModule,
    RoleModule,
    UserRoleModule,
    UserSchoolModule,
    MediumStandardSubjectModule,
    TeacherSubjectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
