const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 2000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5uoh0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    // Collections
    const userCollection = client.db("taskMavenDB").collection("users");
    const taskCollection = client.db("taskMavenDB").collection("tasks_collection");

    // Create User API
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };

        // Check if the user with the same email already exists
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.status(400).send({ message: 'User with this email already exists' });
        }

        const result = await userCollection.insertOne(user);
        res.status(200).send({ message: 'User added successfully', result });
      } catch (err) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // Create Task API
    app.post('/tasks', async (req, res) => {
      try {
        const task = req.body;
        if (!task.title || !task.description || !task.date || !task.category) {
          return res.status(400).send({ message: 'All fields are required' });
        }

        const result = await taskCollection.insertOne(task);
        res.status(200).send({ message: 'Task created successfully', result });
      } catch (err) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // Get Tasks API
    app.get('/tasks', async (req, res) => {
      try {
        const result = await taskCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: 'Error fetching tasks' });
      }
    });

    // PATCH Update Task API
    app.patch('/tasks/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const updatedTask = req.body;

     if (!updatedTask.title || !updatedTask.description || !updatedTask.date || !updatedTask.category) {
       return res.status(400).send({ message: 'All fields are required for update' });
     }

     const result = await taskCollection.updateOne(
       { _id: new require('mongodb').ObjectId(id) },
       { $set: updatedTask }
     );

     if (result.matchedCount === 0) {
       return res.status(404).send({ message: 'Task not found' });
     }

     res.status(200).send({ message: 'Task updated successfully', result });
   } catch (err) {
     console.error('Error updating task:', err);  // Add more detailed logging
     res.status(500).send({ message: 'Error updating task', error: err.message });
   }
});


    // DELETE Task API
// Delete Task API
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the provided ID
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid task ID' });
    }

    // Perform the delete operation
    const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });

    // If no task is found with the given ID
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Task not found' });
    }

    res.status(200).send({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).send({ message: 'Error deleting task', error: err.message });
  }
});


    // Test MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");

  } catch (err) {
    console.error('Error:', err);
  }
}

run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
