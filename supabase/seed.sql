-- Local/dev seed data. Not applied to production. Gives Phases 5-11
-- something real to build against instead of lorem ipsum. IDs are
-- explicit (real, randomly-generated UUIDs — not gen_random_uuid()) so
-- rows can cross-reference each other clearly within this file. They must
-- be genuine RFC 4122 UUIDs, not readable placeholders like
-- '11111111-1111-...': anything a client submits back to the server
-- (e.g. a question_id in a quiz answer payload) gets validated with Zod's
-- strict `.uuid()`, which checks the version/variant nibbles and rejects
-- malformed-but-hex-looking strings.

-- ============================================================ subjects ===
insert into subjects (id, slug, name, description, icon, sort_order) values
  ('d28cb5bf-f330-4a69-a37f-732f8ab765a9', 'english', 'English',
   'Grammar, vocabulary, listening, and conversation.', 'languages', 1),
  ('03753a1c-3bc4-4138-8643-6ff042be7e4d', 'mathematics', 'Mathematics',
   'From arithmetic to calculus, one topic at a time.', 'sigma', 2);

-- ============================================================== topics ===
insert into topics (id, subject_id, slug, name, sort_order) values
  ('cf6ec2a6-3363-4720-b446-b5fa038a5632', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'vocabulary', 'Vocabulary', 1),
  ('3e93c500-aea7-45f5-8871-c528aef76087', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'grammar', 'Grammar', 2),
  ('77b60487-33e0-4d71-970f-0b1b25a51a46', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'listening', 'Listening', 3),
  ('ad87da3f-fa87-4148-bbdd-25ca5da86edb', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'reading', 'Reading', 4),
  ('b7d3f386-e306-406a-b96f-da7ae3acbcd7', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'speaking', 'Speaking', 5),
  ('80f28114-e711-4e89-b9d5-48d296fa9230', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'writing', 'Writing', 6),
  ('cd1ac3c9-1321-415f-b44f-300b2213fac6', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'idioms', 'Idioms', 7),
  ('3c2245ed-fbd6-4c66-b968-39ce690e903b', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'phrasal-verbs', 'Phrasal Verbs', 8),
  ('aacee177-c969-41c4-b732-0a830e2fd8ea', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'business-english', 'Business English', 9),
  ('af93ca6d-e959-4406-a5cb-05729bec15cd', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'pronunciation', 'Pronunciation', 10),
  ('401029b0-4322-42a3-a353-870d11d0afa6', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'verb-tenses', 'Verb Tenses', 11),
  ('7ec571b5-3cbf-4c75-a956-9dc508fffbe3', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'conditionals', 'Conditionals', 12),
  ('447e2122-b19b-4a96-8768-02a62f6bf2d2', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'articles', 'Articles', 13),
  ('7fd9f27a-d153-4a46-9313-8c8c0ff775d0', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'prepositions', 'Prepositions', 14),
  ('0d091372-8acc-4573-abe3-96a31ea36071', 'd28cb5bf-f330-4a69-a37f-732f8ab765a9', 'conversation', 'Conversation', 15),
  ('4c289d08-460e-4720-b3ba-1c0163fd48a5', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'arithmetic', 'Arithmetic', 1),
  ('4ffb6ade-3d81-4639-a9bb-98be1121b280', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'fractions', 'Fractions', 2),
  ('cd8e2df2-3a35-445f-94f1-dcf46dab65aa', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'decimals', 'Decimals', 3),
  ('e968a560-55fc-4569-8aca-334fac231bc0', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'percentages', 'Percentages', 4),
  ('c7d62f0a-c1ac-4019-a57f-d3c9ef4d160c', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'ratios', 'Ratios', 5),
  ('5d119dec-8749-4fb8-b65d-a3c6b69571cb', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'algebra', 'Algebra', 6),
  ('5f41f7fe-ad15-47fa-89fb-3685a8cb21b6', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'geometry', 'Geometry', 7),
  ('e0ae4616-ad88-4d5f-b18b-66cc195dc1ad', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'trigonometry', 'Trigonometry', 8),
  ('2161cfae-893e-46b9-b495-64821bdff206', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'functions', 'Functions', 9),
  ('a86a9998-3fd2-4a5e-bc46-82ce80489394', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'statistics', 'Statistics', 10),
  ('f3a64d23-09f4-48d2-bb8c-35e78554fb3a', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'probability', 'Probability', 11),
  ('ca6fa91a-f946-4dfa-b86e-abc63dfcf80a', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'calculus', 'Calculus', 12),
  ('511c52f6-4447-4bb0-af98-bd0baa6cbffc', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'word-problems', 'Word Problems', 13),
  ('f2c9ae4a-7835-43cb-992e-81e9f59e7548', '03753a1c-3bc4-4138-8643-6ff042be7e4d', 'logic', 'Logic', 14);

-- ============================================================= lessons ===
insert into lessons (id, topic_id, slug, title, description, difficulty, xp_reward, estimated_minutes, sort_order, is_published) values
  ('32413973-c3cc-4829-acff-aa2520bc634e', '3e93c500-aea7-45f5-8871-c528aef76087',
   'present-simple-vs-continuous', 'Present Simple vs. Present Continuous',
   'Learn when to use each tense and the signal words that give it away.',
   'beginner', 10, 6, 1, true),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', '4ffb6ade-3d81-4639-a9bb-98be1121b280',
   'adding-fractions-different-denominators', 'Adding Fractions with Different Denominators',
   'Find a common denominator and add fractions confidently.',
   'beginner', 10, 6, 1, true),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', '3e93c500-aea7-45f5-8871-c528aef76087',
   'present-simple-questions', 'Asking Questions in the Present Simple',
   'Learn how to form yes/no and wh- questions using do/does.',
   'beginner', 10, 6, 2, true),
  ('3fd0d1c1-0bcd-447d-85c6-3e7ba0b01476', 'cd8e2df2-3a35-445f-94f1-dcf46dab65aa',
   'converting-fractions-to-decimals', 'Converting Fractions to Decimals',
   'Turn any fraction into its decimal form by dividing.',
   'beginner', 10, 5, 1, true);

-- Lesson 303 requires 301 first — gives the topic/lesson list something
-- real to lock/unlock, and the dashboard's recommendation logic something
-- to actually filter. The decimals lesson requires the fractions lesson
-- (a different topic entirely) — this is what makes the *decimals topic
-- itself* show as locked in the topic tree until it's done (docs/08-
-- roadmap.md Phase 8: "topic locking based on lesson_prerequisites").
insert into lesson_prerequisites (lesson_id, prerequisite_lesson_id) values
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', '32413973-c3cc-4829-acff-aa2520bc634e'),
  ('3fd0d1c1-0bcd-447d-85c6-3e7ba0b01476', '21b83e97-5a4c-465d-9645-63d2b17dd586');

-- Questions embedded directly in lesson_sections (interactive_exercise),
-- not part of any quiz — quiz_id is left null on purpose (see docs/04).
insert into questions (id, quiz_id, type, prompt, explanation, sort_order, points) values
  ('a24652b8-7375-4a0e-a985-6ce95ab479ae', null, 'multiple_choice',
   'She ___ (make) dinner right now.',
   '"Right now" signals the Present Continuous: is/am/are + verb-ing.', 1, 1),
  ('dd609aea-b2c7-4cfa-80e8-0c7073653bc6', null, 'multiple_choice',
   'Which question is correctly formed?',
   'After Do/Does, the main verb stays in its base form — the -s moves onto "does".', 1, 1),
  ('4fa4e93d-ebc8-4191-8bc6-ec34544e8b1a', null, 'multiple_choice',
   'What is $\frac{1}{3} + \frac{1}{6}$?',
   'Convert to sixths: $\frac{2}{6} + \frac{1}{6} = \frac{3}{6} = \frac{1}{2}$.', 1, 1);

-- Numeric-tolerance interactive exercise for the new decimals lesson,
-- reusing the same metadata-driven grading path added in Phase 7.
insert into questions (id, quiz_id, type, prompt, explanation, sort_order, points, metadata) values
  ('cffdd52a-a058-4163-b207-020de8bf06e0', null, 'typing',
   'Convert $\frac{1}{4}$ to a decimal.',
   '$1 \div 4 = 0.25$.', 1, 1, '{"grading": "numeric", "tolerance": 0.001}');

insert into answers (question_id, content, is_correct, sort_order) values
  ('a24652b8-7375-4a0e-a985-6ce95ab479ae', 'is making', true, 1),
  ('a24652b8-7375-4a0e-a985-6ce95ab479ae', 'makes', false, 2),
  ('a24652b8-7375-4a0e-a985-6ce95ab479ae', 'make', false, 3),
  ('dd609aea-b2c7-4cfa-80e8-0c7073653bc6', 'Does she play the piano?', true, 1),
  ('dd609aea-b2c7-4cfa-80e8-0c7073653bc6', 'Does she plays the piano?', false, 2),
  ('dd609aea-b2c7-4cfa-80e8-0c7073653bc6', 'Do she play the piano?', false, 3),
  ('4fa4e93d-ebc8-4191-8bc6-ec34544e8b1a', '$\frac{1}{2}$', true, 1),
  ('4fa4e93d-ebc8-4191-8bc6-ec34544e8b1a', '$\frac{2}{9}$', false, 2),
  ('4fa4e93d-ebc8-4191-8bc6-ec34544e8b1a', '$\frac{1}{6}$', false, 3),
  ('cffdd52a-a058-4163-b207-020de8bf06e0', '0.25', true, 1);

insert into lesson_sections (lesson_id, section_type, sort_order, content, question_id) values
  ('32413973-c3cc-4829-acff-aa2520bc634e', 'explanation', 1,
   '{"heading": "Two ways to talk about now", "body": "Use the Present Simple for habits, facts, and routines (\"She works from home.\"). Use the Present Continuous for actions happening right now or temporary situations (\"She is working from home this week.\")."}', null),
  ('32413973-c3cc-4829-acff-aa2520bc634e', 'example', 2,
   '{"examples": [{"text": "I play tennis every Saturday.", "note": "habit -> Present Simple"}, {"text": "I am playing tennis right now.", "note": "happening now -> Present Continuous"}]}', null),
  ('32413973-c3cc-4829-acff-aa2520bc634e', 'hint', 3,
   '{"text": "Signal words like \"now\", \"right now\", \"at the moment\" point to the Present Continuous; \"always\", \"usually\", \"every day\" point to the Present Simple."}', null),
  ('32413973-c3cc-4829-acff-aa2520bc634e', 'interactive_exercise', 4,
   '{"prompt": "Try it yourself:"}', 'a24652b8-7375-4a0e-a985-6ce95ab479ae'),
  ('32413973-c3cc-4829-acff-aa2520bc634e', 'summary', 5,
   '{"recap": "You practiced telling the Present Simple and Present Continuous apart using habits vs. right-now actions and their signal words."}', null),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', 'explanation', 1,
   '{"heading": "Common denominators", "body": "To add fractions with different denominators, rewrite both fractions using their least common denominator (LCD), then add the numerators. For example, $\\frac{1}{4} + \\frac{1}{6}$ needs a common denominator of 12."}', null),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', 'example', 2,
   '{"examples": [{"text": "$\\frac{1}{4} + \\frac{1}{6} = \\frac{3}{12} + \\frac{2}{12} = \\frac{5}{12}$", "note": "LCD of 4 and 6 is 12"}]}', null),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', 'hint', 3,
   '{"text": "Find the LCD by listing multiples of each denominator until one matches, or multiply the denominators together as a shortcut: $4 \\times 6 = 24$ works, but the least common denominator ($12$) keeps the numbers smaller."}', null),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', 'interactive_exercise', 4,
   '{"prompt": "Try it yourself:"}', '4fa4e93d-ebc8-4191-8bc6-ec34544e8b1a'),
  ('21b83e97-5a4c-465d-9645-63d2b17dd586', 'summary', 5,
   '{"recap": "You practiced adding fractions with different denominators by finding a common denominator first, then adding the numerators."}', null),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', 'explanation', 1,
   '{"heading": "Do or does?", "body": "To ask a yes/no question in the Present Simple, use Do (I/you/we/they) or Does (he/she/it) before the subject, then the base form of the verb: \"Do you play tennis?\" \"Does she work here?\""}', null),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', 'example', 2,
   '{"examples": [{"text": "Do they live in Paris?", "note": "plural subject -> Do"}, {"text": "Does he like coffee?", "note": "he/she/it -> Does + base verb, no -s"}]}', null),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', 'hint', 3,
   '{"text": "Remember: after Do/Does, the main verb never takes an -s, even for he/she/it — the -s moves to \"does\"."}', null),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', 'interactive_exercise', 4,
   '{"prompt": "Try it yourself:"}', 'dd609aea-b2c7-4cfa-80e8-0c7073653bc6'),
  ('78c1ad1b-0a3d-4fbd-865e-589dfedbe6b2', 'summary', 5,
   '{"recap": "You learned how to form Present Simple questions with Do/Does and practiced picking the correctly-formed question."}', null),
  ('3fd0d1c1-0bcd-447d-85c6-3e7ba0b01476', 'explanation', 1,
   '{"heading": "Divide the numerator by the denominator", "body": "To convert a fraction to a decimal, divide the numerator by the denominator: $\\frac{3}{4} = 3 \\div 4 = 0.75$."}', null),
  ('3fd0d1c1-0bcd-447d-85c6-3e7ba0b01476', 'example', 2,
   '{"examples": [{"text": "$\\frac{1}{2} = 1 \\div 2 = 0.5$", "note": "a common one to memorize"}]}', null),
  ('3fd0d1c1-0bcd-447d-85c6-3e7ba0b01476', 'interactive_exercise', 3,
   '{"prompt": "Try it yourself:"}', 'cffdd52a-a058-4163-b207-020de8bf06e0');

-- ============================================================= quizzes ===
insert into quizzes (id, topic_id, lesson_id, title, description, difficulty, is_timed, xp_reward, is_published) values
  ('4c85d100-0bb8-4ff6-b7ee-e31bc3feed21', '3e93c500-aea7-45f5-8871-c528aef76087',
   '32413973-c3cc-4829-acff-aa2520bc634e', 'Present Tenses Practice',
   'Check your understanding of Present Simple vs. Present Continuous.',
   'beginner', false, 20, true),
  ('6d501695-ff32-47e9-a3f4-f82b5d016ca5', '4ffb6ade-3d81-4639-a9bb-98be1121b280',
   '21b83e97-5a4c-465d-9645-63d2b17dd586', 'Fraction Basics Quiz',
   'Practice adding and comparing fractions.',
   'beginner', false, 20, true);

insert into questions (id, quiz_id, type, prompt, explanation, sort_order, points) values
  ('51dfa2fa-e6f7-4ffb-a8ad-663316a0e529', '4c85d100-0bb8-4ff6-b7ee-e31bc3feed21', 'multiple_choice',
   'Which sentence correctly uses the Present Continuous?',
   'The Present Continuous uses "am/is/are" + a verb ending in -ing.', 1, 1),
  ('0bdcb653-a815-4efb-ad23-6f6d5cc710b8', '4c85d100-0bb8-4ff6-b7ee-e31bc3feed21', 'fill_blank',
   'She usually ___ (walk) to work, but today she ___ (drive).',
   'Habit -> Present Simple ("walks"); today, right now -> Present Continuous ("is driving").', 2, 1),
  ('25f40a2e-3495-40a5-85c1-c42ef2b5077f', '4c85d100-0bb8-4ff6-b7ee-e31bc3feed21', 'typing',
   'Rewrite in the Present Simple: "I am eating lunch."  ->  "I ___ lunch every day."',
   'The Present Simple third-person-singular rule does not apply to "I" — the base form is used.', 3, 1),
  ('5f64d5d8-4717-4a8f-a8f4-f2be97207151', '6d501695-ff32-47e9-a3f4-f82b5d016ca5', 'multiple_choice',
   'What is $\frac{1}{4} + \frac{1}{6}$?',
   'Convert to twelfths: $\frac{3}{12} + \frac{2}{12} = \frac{5}{12}$.', 1, 1),
  ('40515ae6-fb54-4aaf-b387-ab79670778c0', '6d501695-ff32-47e9-a3f4-f82b5d016ca5', 'ordering',
   'Order these fractions from smallest to largest: $\frac{3}{4}, \frac{1}{2}, \frac{5}{8}$',
   'Convert to eighths: 4/8, 6/8, 5/8 -> order is 1/2, 5/8, 3/4.', 2, 1);

-- Numeric-tolerance question (docs/08-roadmap.md Phase 7): a typed decimal
-- answer graded via lib/data/progress.ts's numeric grading path rather than
-- exact/pattern text matching, so "0.75", ".75", and "0.750" all match.
insert into questions (id, quiz_id, type, prompt, explanation, sort_order, points, metadata) values
  ('cd4dcdbf-36e7-42ba-96ac-ad919557c158', '6d501695-ff32-47e9-a3f4-f82b5d016ca5', 'typing',
   'Convert $\frac{3}{4}$ to a decimal.',
   '$3 \div 4 = 0.75$.', 3, 1, '{"grading": "numeric", "tolerance": 0.001}');

insert into answers (question_id, content, is_correct, sort_order) values
  ('51dfa2fa-e6f7-4ffb-a8ad-663316a0e529', 'She is reading a book right now.', true, 1),
  ('51dfa2fa-e6f7-4ffb-a8ad-663316a0e529', 'She reads a book every night.', false, 2),
  ('51dfa2fa-e6f7-4ffb-a8ad-663316a0e529', 'She read a book yesterday.', false, 3),
  ('0bdcb653-a815-4efb-ad23-6f6d5cc710b8', 'walks / is driving', true, 1),
  ('25f40a2e-3495-40a5-85c1-c42ef2b5077f', 'eat', true, 1),
  ('5f64d5d8-4717-4a8f-a8f4-f2be97207151', '$\frac{5}{12}$', true, 1),
  ('5f64d5d8-4717-4a8f-a8f4-f2be97207151', '$\frac{2}{10}$', false, 2),
  ('5f64d5d8-4717-4a8f-a8f4-f2be97207151', '$\frac{1}{2}$', false, 3),
  ('40515ae6-fb54-4aaf-b387-ab79670778c0', '$\frac{1}{2}$', true, 1),
  ('40515ae6-fb54-4aaf-b387-ab79670778c0', '$\frac{5}{8}$', true, 2),
  ('40515ae6-fb54-4aaf-b387-ab79670778c0', '$\frac{3}{4}$', true, 3),
  ('cd4dcdbf-36e7-42ba-96ac-ad919557c158', '0.75', true, 1);

-- ======================================================= achievements ===
insert into achievements (slug, name, description, icon, criteria, xp_bonus) values
  ('first-lesson', 'First Steps', 'Complete your first lesson.', 'footprints',
   '{"type": "lessons_completed", "value": 1}', 10),
  ('week-streak', 'On Fire', 'Reach a 7-day streak.', 'flame',
   '{"type": "streak", "value": 7}', 25),
  ('month-streak', 'Unstoppable', 'Reach a 30-day streak.', 'flame',
   '{"type": "streak", "value": 30}', 100),
  ('fifty-lessons', 'Scholar', 'Complete 50 lessons.', 'graduation-cap',
   '{"type": "lessons_completed", "value": 50}', 150),
  ('perfect-quiz', 'Perfectionist', 'Score 100% on a quiz.', 'star',
   '{"type": "quiz_score", "value": 100}', 20);

-- ============================================================ avatars ===
insert into avatars (name, image_url, is_premium, sort_order) values
  ('Fox', '/avatars/fox.png', false, 1),
  ('Owl', '/avatars/owl.png', false, 2),
  ('Otter', '/avatars/otter.png', false, 3),
  ('Panda', '/avatars/panda.png', false, 4),
  ('Phoenix', '/avatars/phoenix.png', true, 5),
  ('Dragon', '/avatars/dragon.png', true, 6);
