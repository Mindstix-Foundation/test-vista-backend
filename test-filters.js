/**
 * Filter Logic Test Script
 * This demonstrates the filtering logic we've implemented for the /questions endpoint
 */

// Mock data and filters
const mockQuestions = [
  {
    id: 1,
    question_type_id: 1,
    board_question: true,
    question_texts: [
      {
        id: 101,
        question_text: "Sample question 1",
        question_text_topics: [
          { instruction_medium_id: 1, is_verified: true }
        ]
      }
    ]
  },
  {
    id: 2,
    question_type_id: 2,
    board_question: false,
    question_texts: [
      {
        id: 102,
        question_text: "Sample question 2",
        question_text_topics: [
          { instruction_medium_id: 2, is_verified: true }
        ]
      }
    ]
  },
  {
    id: 3,
    question_type_id: 1,
    board_question: true,
    question_texts: [
      {
        id: 103,
        question_text: "Sample question 3",
        question_text_topics: [
          { instruction_medium_id: 1, is_verified: false }
        ]
      }
    ]
  },
  {
    id: 4,
    question_type_id: 3,
    board_question: true,
    question_texts: [
      {
        id: 104,
        question_text: "Sample question 4",
        question_text_topics: []
      }
    ]
  },
  {
    id: 5,
    question_type_id: 1,
    board_question: true,
    question_texts: [
      {
        id: 105,
        question_text: "Sample question with search term",
        question_text_topics: [
          { instruction_medium_id: 1, is_verified: true }
        ]
      }
    ]
  }
];

// Function to apply filters
function applyFilters(questions, filters) {
  console.log(`\n>>> Applying filters: ${JSON.stringify(filters)}`);
  
  // Pre-filter by question_type_id if specified
  let filteredByMainProperties = [...questions];
  
  if (filters.question_type_id !== undefined) {
    filteredByMainProperties = filteredByMainProperties.filter(
      q => q.question_type_id === filters.question_type_id
    );
    console.log(`After question_type_id filter: ${filteredByMainProperties.length} questions`);
  }
  
  if (filters.board_question !== undefined) {
    filteredByMainProperties = filteredByMainProperties.filter(
      q => q.board_question === filters.board_question
    );
    console.log(`After board_question filter: ${filteredByMainProperties.length} questions`);
  }
  
  // STEP 1: Filter question_texts based on our criteria
  const filteredQuestions = filteredByMainProperties.map(question => {
    const questionCopy = { ...question };
    
    // Apply search filter if specified
    if (filters.search !== undefined) {
      questionCopy.question_texts = questionCopy.question_texts.filter(text => 
        text.question_text.toLowerCase().includes(filters.search.toLowerCase())
      );
      if (questionCopy.question_texts.length === 0) {
        console.log(`Question ${questionCopy.id} excluded by search filter`);
      }
    }
    
    // Filter for medium and verification status
    if (filters.instruction_medium_id !== undefined || filters.is_verified !== undefined) {
      questionCopy.question_texts = questionCopy.question_texts.filter(text => {
        // Only keep texts that have question_text_topics and at least one matches our criteria
        const hasMatch = text.question_text_topics && text.question_text_topics.some(topic => {
          // Check if all specified filters match
          const mediumMatches = filters.instruction_medium_id === undefined || 
                                topic.instruction_medium_id === filters.instruction_medium_id;
          
          const verifiedMatches = filters.is_verified === undefined || 
                                 topic.is_verified === filters.is_verified;
          
          return mediumMatches && verifiedMatches;
        });
        
        if (!hasMatch) {
          console.log(`Text ${text.id} excluded by medium/verification filter`);
        }
        
        return hasMatch;
      });
    }
    
    return questionCopy;
  });
  
  // STEP 2: Filter out questions that have no matching texts
  const validQuestions = filteredQuestions.filter(q => q.question_texts.length > 0);
  
  // Log results
  console.log(`\nResults: ${questions.length} questions initially, ${validQuestions.length} after all filters`);
  validQuestions.forEach(q => {
    console.log(`Question ${q.id} has ${q.question_texts.length} matching texts`);
  });
  
  return validQuestions;
}

// Test different filter combinations
const testFilters = [
  // Test 1: filter by medium and verification
  {
    instruction_medium_id: 1,
    is_verified: true
  },
  // Test 2: filter by question type
  {
    question_type_id: 1
  },
  // Test 3: combined filters
  {
    question_type_id: 1,
    instruction_medium_id: 1
  },
  // Test 4: board question filter
  {
    board_question: true
  },
  // Test 5: search filter
  {
    search: "search term"
  },
  // Test 6: combined complex filter
  {
    question_type_id: 1,
    board_question: true,
    instruction_medium_id: 1,
    is_verified: true,
    search: "Sample"
  }
];

// Run all tests
console.log("=== FILTER LOGIC TEST RESULTS ===");

testFilters.forEach((filters, index) => {
  console.log(`\n----- TEST ${index + 1} -----`);
  const result = applyFilters(mockQuestions, filters);
  
  console.log("\nFiltered Result:");
  console.log(JSON.stringify(result.map(q => ({
    id: q.id,
    question_type_id: q.question_type_id,
    board_question: q.board_question,
    text_count: q.question_texts.length
  })), null, 2));
}); 