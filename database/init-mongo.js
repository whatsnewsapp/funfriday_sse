// MongoDB initialization script
// This runs when the container first starts

const fs = require('fs');

// Switch to the quiz database
db = db.getSiblingDB('quizdb');

// Read questions from JSON file
const questionsData = JSON.parse(fs.readFileSync('/tmp/questions.json', 'utf8'));

// Handle both array format and { questions: [...] } format
const questions = Array.isArray(questionsData) ? questionsData : questionsData.questions;

// Insert questions into the collection
if (questions && questions.length > 0) {
  db.questions.insertMany(questions);
  print(`✅ Inserted ${questions.length} questions into the database`);
} else {
  print('⚠️  No questions found in questions.json');
}

// Create index on category for faster queries
db.questions.createIndex({ category: 1 });
print('✅ Created index on category field');

// Show collection stats
print(`Total questions in database: ${db.questions.countDocuments()}`);
