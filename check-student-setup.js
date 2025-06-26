const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStudentSetup() {
  try {
    console.log('Checking student setup...\n');

    // Check if STUDENT role exists
    const studentRole = await prisma.role.findFirst({
      where: { role_name: 'STUDENT' }
    });
    
    console.log('1. STUDENT Role:', studentRole ? '✅ Found' : '❌ Not found');
    if (studentRole) {
      console.log('   Role ID:', studentRole.id);
      console.log('   Role Name:', studentRole.role_name);
    }

    // Check if any users have STUDENT role
    const studentsWithRole = await prisma.user_Role.findMany({
      where: {
        role: {
          role_name: 'STUDENT'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email_id: true,
            name: true
          }
        },
        role: true
      }
    });

    console.log('\n2. Users with STUDENT role:', studentsWithRole.length);
    studentsWithRole.forEach((userRole, index) => {
      console.log(`   ${index + 1}. User ID: ${userRole.user.id}, Email: ${userRole.user.email_id}, Name: ${userRole.user.name}`);
    });

    // Check if any student profiles exist
    const studentProfiles = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email_id: true,
            name: true
          }
        },
        school_standard: {
          include: {
            school: {
              select: {
                id: true,
                name: true
              }
            },
            standard: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log('\n3. Student profiles:', studentProfiles.length);
    studentProfiles.forEach((student, index) => {
      console.log(`   ${index + 1}. Student ID: ${student.id}, User: ${student.user.email_id}`);
      console.log(`       School: ${student.school_standard.school.name}`);
      console.log(`       Standard: ${student.school_standard.standard.name}`);
    });

    // Check if students have both role and profile
    const completeStudents = await prisma.user.findMany({
      where: {
        user_roles: {
          some: {
            role: {
              role_name: 'STUDENT'
            }
          }
        },
        student: {
          isNot: null
        }
      },
      include: {
        user_roles: {
          include: {
            role: true
          }
        },
        student: {
          include: {
            school_standard: {
              include: {
                school: true,
                standard: true
              }
            }
          }
        }
      }
    });

    console.log('\n4. Complete student users (with both role and profile):', completeStudents.length);
    completeStudents.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email_id}`);
      console.log(`       Student ID: ${user.student.id}`);
      console.log(`       School: ${user.student.school_standard.school.name}`);
      console.log(`       Standard: ${user.student.school_standard.standard.name}`);
      console.log(`       Roles: ${user.user_roles.map(ur => ur.role.role_name).join(', ')}`);
    });

    // Check available subjects for the first student
    if (completeStudents.length > 0) {
      const firstStudent = completeStudents[0];
      console.log(`\n5. Checking available subjects for student: ${firstStudent.email_id}`);
      
      const availableSubjects = await prisma.subject.findMany({
        where: {
          teacher_subjects: {
            some: {
              school_standard_id: firstStudent.student.school_standard_id
            }
          }
        },
        include: {
          teacher_subjects: {
            where: {
              school_standard_id: firstStudent.student.school_standard_id
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email_id: true
                }
              }
            }
          }
        }
      });

      console.log(`   Available subjects: ${availableSubjects.length}`);
      availableSubjects.forEach((subject, index) => {
        console.log(`   ${index + 1}. ${subject.name} - ${subject.teacher_subjects.length} teacher(s)`);
        subject.teacher_subjects.forEach((ts, tsIndex) => {
          console.log(`       ${tsIndex + 1}. ${ts.user.name} (${ts.user.email_id})`);
        });
      });
    }

  } catch (error) {
    console.error('Error checking student setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentSetup(); 