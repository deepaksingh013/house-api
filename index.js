const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("DB is connected");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname.replace(/\s/g, '')}`; // Add the timestamp to the filename
    cb(null, fileName);
  },
});

// Create multer upload instance
const uploadMiddleware = multer({ storage }).array('images', 5);
const imageSchema = new mongoose.Schema({
  name: String,
  url: String,
});

const parentSchema = new mongoose.Schema({
  yourName: String,
  lastName: String,
  classSelection: String,
  country: String,
  email: String,
  contact: String,
  religion: String,
  address: String,
  city: String,
  pincode: String,
  profession: String,
  education: String,
  hearaboutus: String,
  dob: String, // Assuming the DOB is stored as a string
  images: [imageSchema],
});

const Parent = mongoose.model('Parent', parentSchema);

// Handle POST request for uploading images
app.post('/upload', uploadMiddleware, (req, res) => {
  if (req.files.length === 0) {
    res.status(400).json({ message: 'No images uploaded' });
    return;
  }

  const {
    yourName, lastName, hearaboutus, profession, education, email, contact, country, religion,
    address, city, pincode, dob, classSelection,
  } = req.body;
  const images = req.files.map((file) => ({
    name: file.originalname,
    url: `http://localhost:5000/uploads/${file.filename}`, // Generate the image URL
  }));

  const parentDocument = new Parent({
    yourName, email, country, contact, education, profession, hearaboutus, religion, address,
    city, pincode, lastName, dob: new Date(dob).toISOString(), classSelection, images,
  });

  parentDocument.save()
    .then((savedParent) => {
      // Generate image URLs and update the parent document
      savedParent.images.forEach((image) => {
        image.url = `http://localhost:5000/uploads/${image.url.split('/').pop()}`; // Remove the timestamp from the image URL
      });
      savedParent.save(); // Save the updated parent document

      res.status(200).json({ message: 'Form has been submitted', parent: savedParent });
    })
    .catch((saveError) => {
      console.error(saveError);
      res.status(500).json({ message: 'Error saving images and data to the database' });
    });
});

app.get('/listuser', (req, res) => {
  Parent.find()
    .then((parents) => {
      res.status(200).json(parents);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving data from the database' });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
