const http = require('http')
const url = require('url')
const { parse } = require('querystring')

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
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
  let urlRequest = url.parse(req.url, true)
  console.log(urlRequest)
  // console.log(`method: ${method} url: ${url}`)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, OPTIONS, DELETE, PATCH'
  )

  if (req.method === 'GET' && urlRequest.pathname === '/todos') {
    await Todo.find({}).then((result) => {
      res.end(JSON.stringify(result))
    })
  }

  if (method === 'POST' && url === '/addtodo') {
    req.on('data', async (chunk) => {
      const data = JSON.parse(chunk)
      const newTodo = new Todo(data)
      console.log(newTodo)
      await newTodo.save((err, newTodo) => {
        if (err) {
          console.error(err)
          res.end(err)
        }
        res.end(JSON.stringify(newTodo))
      })
    })
  }

  if (method === 'DELETE' && url === '/delete') {
    req.on('data', async (chunk) => {
      const keys = JSON.parse(chunk)
      console.log(keys)
      await Todo.deleteMany({ key: { $in: keys } }).then(
        res.end(JSON.stringify(keys))
      )
    })
  }

  if (method === 'PATCH' && url === '/changestatuses') {
    req.on('data', async (chunk) => {
      const data = JSON.parse(chunk)
      console.log(data)
      await Todo.updateMany({}, { completed: data })
      await Todo.find({}).then((result) => {
        res.end(JSON.stringify(result))
      })
    })
  }

  if (method === 'PATCH' && url === '/edit') {
    req.on('data', async (chunk) => {
      const data = JSON.parse(chunk)
      console.log(data)

      const result = await Todo.findOneAndUpdate(
        { key: data.key },
        { completed: !data.completed },
        { new: true }
      )
      res.end(JSON.stringify(result))
    })
  }

  if (method === 'DELETE' && url === '/clearcompleted') {
    await Todo.deleteMany({ completed: true })
    await Todo.find({}).then((result) => {
      res.end(JSON.stringify(result))
    })
  }

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
  }
})

server.listen(9800)
