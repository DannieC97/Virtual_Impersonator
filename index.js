const express = require('express');
require('dotenv').config();
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const API_Key_ElevenLabs = process.env.API_KEY_ELEVENLABS;
const API_Key_GPT = process.env.API_KEY_GPT;
const uri = process.env.uri


const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: API_Key_GPT,
});
const openai = new OpenAIApi(configuration);
let chatGPTResponse = ''

async function getGPT3Response(prompt,name) {
  const customPrompt = `Can you generate a message for me in the style of ${name} where he delivers a custom message as if he was speaking to someone. Can you also make sure that it is under 300 characters. Make sure you respond to this with only the message. Also use no hashtags in the message. Using the words I provide ${prompt}`
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: customPrompt}],
    n:1
  });
  //console.log(completion.data.choices[0].message.content);
  return completion.data.choices[0].message.content
}

//getGPT3Response('hello everyone, how you doing today',"joe rogan")


// set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

async function connect(){
  try{
    await mongoose.connect(uri)
    console.log("connected to MongoDB")
  }
  catch(error){
    console.log(error)
  }
}
connect()



const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validate user input
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  try {
    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    const user = new User({ username: username, email: email, password: hashedPassword });
    await user.save();
    return res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Create a login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate user input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  try {
    // Compare entered password with hashed password from database
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Return success message with username
    res.status(200).json({ message: 'Logged in successfully', username: user.username });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


app.get('/getText', async (req, res) => {
  res.json(chatGPTResponse)
});


// Voice ID: 21m00Tcm4TlvDq8ikWAM
app.post('/getAudio', async (req, res) => {
  let text = req.body.text;
  const id = await getVoiceID(req.body.name);
  const rephraseSwitch =  req.body.rephraseSwitch
  //console.log(req.body)

  // Get the character count from the API
  const charCount = await getCharacterCount();

  // Check if the character count is less than or equal to 0
  if (charCount <= 0) {
    // Send an email notification
    await sendEmailNotification();
  
    res.status(403).json({
      message:
        "I'm sorry, but this application is currently unavailable because I need to purchase more space. If you're interested in using it, please feel free to message me using the link provided in the footer.",
    });
    return;
  }

  if(rephraseSwitch){
    
    text = await getGPT3Response(text,req.body.name)
    chatGPTResponse = text
  }
  
  try {
    
     const headers = {
        'xi-api-key': API_Key_ElevenLabs,
        'Content-Type': 'application/json',
        
      }
    
    const data = {
      'text': text
    };
    const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${id}/stream`, data, {headers,'responseType': 'arraybuffer'});

    res.set('Content-Type', 'audio/mpeg');
    //console.log(response.data)
    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

async function getVoiceID(name) {
  try {
    const config = {
      headers: {
        'xi-api-key': API_Key_ElevenLabs
      }
    };
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', config);

    //console.log(response.data);
    const data = response.data.voices
    //console.log(data.voices)
    for (let i = 0; i < data.length; i++) {
      if (data[i].name == name) {
        
        //console.log(data[i].voice_id)
        return data[i].voice_id;
      }
    }
    return null;
  } catch (error) {
    console.log(error);
  }
}
getVoiceID('Joe Rogan');

// app.get('/voices', async (req, res) => {
//   try {
//     const config = {
//       headers: {
//         'xi-api-key': API_Key_ElevenLabs
//       }
//     };
//     const response = await axios.get('https://api.elevenlabs.io/v1/voices', config);

//     res.json(response.data);
//     //console.log(response.data);
//   } catch (error) {
//     console.log(error);
//   }
// });

let lastEmailSent = null;

app.get('/info', async (req, res) => {
  try {
    const config = {
      headers: {
        'xi-api-key': API_Key_ElevenLabs
      }
    };
    
    const response = await axios.get('https://api.elevenlabs.io/v1/user', config);

    res.json(response.data);
    const charCount = (response.data.subscription.character_limit - response.data.subscription.character_count) - 300;
    
    // Check if enough time has elapsed since the last email was sent
    const now = new Date();
    const hoursSinceLastEmail = lastEmailSent ? (now - lastEmailSent) / (1000 * 60 * 60) : null;
    if (!lastEmailSent || hoursSinceLastEmail >= 24) {
      if(charCount <= 0){
        
        await sendEmailNotification();
        lastEmailSent = now;
      }
    }
  } catch (error) {
    console.log(error);
  }
});
/////////
async function getCharacterCount() {
  try {
    const config = {
      headers: {
        'xi-api-key': API_Key_ElevenLabs
      }
    };
    const response = await axios.get('https://api.elevenlabs.io/v1/user', config);
    const charCount = (response.data.subscription.character_limit - response.data.subscription.character_count) - 300;
    
    return charCount ;
    
  } catch (error) {
    console.log(error);
    return null;
  }
}

///send email if char count reaches 0
async function sendEmailNotification() {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services as well
    auth: {
      user: 'autoservermsger@gmail.com',
      pass: "rnihwzzrobcvxric",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'danielchabi97@gmail.com', // Replace with your email
    subject: 'Character Limit Exceeded',
    text: 'You have run out of characters for your ChatGPT application.',
  };

  try {
    await transporter.sendMail(mailOptions);
    //console.log('Email notification sent!');
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}


app.use(express.static('frontend'));

// start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});