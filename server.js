const http = require('http')

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('Connected')
})

const todoSchema = new mongoose.Schema({
  title: String,
  completed: {
    type: Boolean,
    default: false
  },
  key: String
})

const Todo = mongoose.model('Todo', todoSchema)

const server = http.createServer(async (req, res) => {
  const { method, url } = req
  console.log(`method: ${method} url: ${url}`)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PATCH')

  if (method === 'GET' && url === '/todos') {
    await Todo.find({})
      .then(result => {
        res.end(JSON.stringify(result))
      })
  }

  if (method === 'POST' && url === '/addtodo') {
    req.on('data', async chunk => {
      const data = JSON.parse(chunk)
      const newTodo = new Todo(data)
      console.log(newTodo);
      await newTodo.save((err, newTodo) => {
        if (err) {
          console.error(err)
          res.end(err)
        }
      })
    })

    res.end('added to list')
  }

  if (method === 'DELETE' && url === '/delete') {
    req.on('data', async chunk => {
      const keys = JSON.parse(chunk)

      const result = await Todo.deleteMany({ key: { $in: keys } })

      console.log('result ++ ', result);
    })

    res.end('deleted from list')
  }

  if (method === 'PATCH' && url === '/changestatuses') {
    req.on('data', async chunk => {
      const data = JSON.parse(chunk)

      console.log(data);

      const result = await Todo.updateMany({ key: { $in: data.keys}}, { completed: data.data.completed })
    })

    res.end('statuses updated')
  }

  if (method === 'PATCH' && url === '/edit') {
    req.on('data', async chunk => {
      const data = JSON.parse(chunk)
      console.log(data);

      const result = await Todo.findOneAndUpdate({ key: data.key }, { title: data.title, completed: data.completed }, {new: true})
      res.end(JSON.stringify(result))
    })

    // res.end('task updated')
  }

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
  }
})

server.listen(9800)
