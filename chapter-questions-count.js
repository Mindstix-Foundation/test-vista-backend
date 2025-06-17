const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getQuestionCountsByChapter() {
  try {
    const chapterIds = [1, 3, 4, 5, 6, 7];
    
    console.log('Fetching question counts for chapters:', chapterIds);
    console.log('=' .repeat(60));
    
    for (const chapterId of chapterIds) {
      // Get chapter details first
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          subject: true,
          standard: true
        }
      });
      
      if (!chapter) {
        console.log(`Chapter ID ${chapterId}: NOT FOUND`);
        continue;
      }
      
      // Count questions for this chapter
      const questionCount = await prisma.question.count({
        where: {
          question_topics: {
            some: {
              topic: {
                chapter_id: chapterId
              }
            }
          }
        }
      });
      
      console.log(`Chapter ID ${chapterId}:`);
      console.log(`  Name: ${chapter.name}`);
      console.log(`  Subject: ${chapter.subject.name}`);
      console.log(`  Standard: ${chapter.standard.name}`);
      console.log(`  Question Count: ${questionCount}`);
      console.log('-'.repeat(40));
    }
    
    // Also get a summary with all counts
    console.log('\nSUMMARY:');
    console.log('=' .repeat(60));
    
    const summaryResults = await Promise.all(
      chapterIds.map(async (chapterId) => {
        const chapter = await prisma.chapter.findUnique({
          where: { id: chapterId },
          select: { id: true, name: true }
        });
        
        if (!chapter) return { chapterId, name: 'NOT FOUND', count: 0 };
        
        const count = await prisma.question.count({
          where: {
            question_topics: {
              some: {
                topic: {
                  chapter_id: chapterId
                }
              }
            }
          }
        });
        
        return { chapterId, name: chapter.name, count };
      })
    );
    
    summaryResults.forEach(result => {
      console.log(`Chapter ${result.chapterId} (${result.name}): ${result.count} questions`);
    });
    
    const totalQuestions = summaryResults.reduce((sum, result) => sum + result.count, 0);
    console.log(`\nTotal questions across all specified chapters: ${totalQuestions}`);
    
  } catch (error) {
    console.error('Error fetching question counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
getQuestionCountsByChapter();
