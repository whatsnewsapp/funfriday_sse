// MongoDB initialization script
// This runs when the container first starts

const fs = require('fs');

// Switch to the quiz database
db = db.getSiblingDB('quizdb');

// Read questions from JSON file
const questionsData = JSON.parse(fs.readFileSync('/tmp/questions.json', 'utf8'));

// Handle both array format and { questions: [...] } format
const questions = Array.isArray(questionsData) ? questionsData : questionsData.questions;

// Define quiz banks
const banks = [
  {
    bankId: 'bank-1',
    title: 'Friday Quiz #1',
    description: 'A mixed bag of trivia to kick off the weekend',
    creator: 'system',
    used: false,
    createdAt: new Date(),
  },
  {
    bankId: 'bank-2',
    title: 'Mixed Bag #2',
    description: 'Another round of assorted questions for the curious',
    creator: 'system',
    used: false,
    createdAt: new Date(),
  },
  {
    bankId: 'bank-3',
    title: 'Brain Buster #3',
    description: 'Put your general knowledge to the test',
    creator: 'system',
    used: false,
    createdAt: new Date(),
  },
  {
    bankId: 'bank-4',
    title: 'Pub Quiz #4',
    description: 'Classic pub quiz style questions',
    creator: 'system',
    used: false,
    createdAt: new Date(),
  },
  {
    bankId: 'bank-5',
    title: 'Lightning Round #5',
    description: 'Quick-fire questions across all categories',
    creator: 'system',
    used: false,
    createdAt: new Date(),
  },
];

// Assign each question a random bankId
const bankIds = banks.map(b => b.bankId);
if (questions && questions.length > 0) {
  questions.forEach(q => {
    q.bankId = bankIds[Math.floor(Math.random() * bankIds.length)];
  });

  db.questions.insertMany(questions);
  print(`Inserted ${questions.length} questions into the database`);
} else {
  print('No questions found in questions.json');
}

// Create indexes
db.questions.createIndex({ category: 1 });
db.questions.createIndex({ bankId: 1 });
print('Created indexes on category and bankId fields');

// Insert banks
db.banks.insertMany(banks);
print(`Inserted ${banks.length} banks into the database`);
db.banks.createIndex({ bankId: 1 }, { unique: true });
print('Created unique index on bankId field');

// Show collection stats
print(`Total questions in database: ${db.questions.countDocuments()}`);
print(`Total banks in database: ${db.banks.countDocuments()}`);

// Show question distribution across banks
bankIds.forEach(bankId => {
  const count = db.questions.countDocuments({ bankId });
  print(`  ${bankId}: ${count} questions`);
});
