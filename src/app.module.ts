import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { BoardManagementModule } from './modules/board-management/board-management.module';
import { ChapterModule } from './modules/chapter/chapter.module';
import { TopicModule } from './modules/topic/topic.module';
import { PatternModule } from './modules/pattern/pattern.module';
import { QuestionTypeModule } from './modules/question-type/question-type.module';
import { SectionModule } from './modules/section/section.module';
import { SubsectionQuestionTypeModule } from './modules/subsection-question-type/subsection-question-type.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionModule } from './modules/question/question.module';
import { QuestionTextModule } from './modules/question_text/question-text.module';
import { ImageModule } from './modules/image/image.module';
import { QuestionTopicModule } from './modules/question_topic/question-topic.module';
import { McqOptionModule } from './modules/mcq-option/mcq-option.module';
import { MulterModule } from '@nestjs/platform-express';
import { AwsModule } from './modules/aws/aws.module';
import { QuestionTextTopicMediumModule } from './modules/question_text_topic_medium/question-text-topic-medium.module';
import { PatternFilterModule } from './modules/pattern-filter/pattern-filter.module';
import { CreateTestPaperModule } from './modules/create_test_paper/create-test-paper.module';
import { ChapterMarksDistributionModule } from './modules/chapter-marks-distribution/chapter-marks-distribution.module';
import { ChapterMarksRangeModule } from './modules/chapter-marks-range/chapter-marks-range.module';
import { TestPaperHtmlModule } from './modules/test-paper-html/test-paper-html.module';
import { StudentModule } from './modules/student/student.module';
import { StudentSubjectEnrollmentModule } from './modules/student-subject-enrollment/student-subject-enrollment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    BoardManagementModule,
    ChapterModule,
    TopicModule,
    PatternModule,
    QuestionTypeModule,
    SectionModule,
    SubsectionQuestionTypeModule,
    AuthModule,
    QuestionModule,
    QuestionTextModule,
    ImageModule,
    QuestionTopicModule,
    McqOptionModule,
    QuestionTextTopicMediumModule,
    PatternFilterModule,
    CreateTestPaperModule,
    ChapterMarksDistributionModule,
    ChapterMarksRangeModule,
    TestPaperHtmlModule,
    StudentModule,
    StudentSubjectEnrollmentModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    AwsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
