const express = require('express');
const app = express();

app.use(express.static('dist')); // 또는 build 폴더

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log('Server running on port', port);
});
