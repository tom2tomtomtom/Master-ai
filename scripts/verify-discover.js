const https = require('https');

console.log('🔍 Verifying discover page API...\n');

const start = Date.now();

https.get('https://master-ai-learn.com/api/lessons/search?page=1&limit=5&sortBy=relevance&includeMetadata=true', (res) => {
  let data = '';

  res.on('data', chunk => { data += chunk; });

  res.on('end', () => {
    const duration = Date.now() - start;

    try {
      const json = JSON.parse(data);

      console.log(`✅ API Response Time: ${duration}ms`);
      console.log(`✅ Lessons Returned: ${json.lessons?.length || 0}`);
      console.log(`✅ Has Pagination: ${!!json.pagination}`);

      if (json.lessons && json.lessons.length > 0) {
        console.log(`✅ First Lesson: "${json.lessons[0].title}"`);
        console.log('\n🎉 API IS WORKING CORRECTLY!');
      } else {
        console.log('\n❌ NO LESSONS RETURNED');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
      console.log('Response:', data.slice(0, 200));
    }
  });
}).on('error', (e) => {
  console.log('❌ Request failed:', e.message);
});
