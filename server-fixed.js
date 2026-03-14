const app = require('./server');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
});