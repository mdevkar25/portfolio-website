const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created');
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const Project = require('./models/Project');
const Skill = require('./models/Skill');
const Admin = require('./models/Admin');

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/admin/login');
};

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio')
    .then(async () => {
        console.log('MongoDB Connected');
        // Seed Data if empty
        const count = await Project.countDocuments();
        if (count === 0) {
            await Project.create([
                {
                    title: 'E-Commerce Platform',
                    description: 'A full-featured online store built with MERN stack.',
                    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    tags: ['React', 'Node.js', 'MongoDB', 'Redux'],
                    link: '#'
                },
                {
                    title: 'Task Management App',
                    description: 'A productivity tool to manage daily tasks efficiently.',
                    image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    tags: ['Vue.js', 'Firebase', 'Tailwind CSS'],
                    link: '#'
                },
                {
                    title: 'Portfolio Website',
                    description: 'This very website showcasing my work and skills.',
                    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    tags: ['Node.js', 'Express', 'EJS', 'MongoDB'],
                    link: '#'
                }
            ]);
            console.log('Sample projects seeded');
        }



        // Seed Skills if empty
        const skillCount = await Skill.countDocuments();
        if (skillCount === 0) {
            await Skill.create([
                { name: 'Java', category: 'Backend', icon: 'fab fa-java' },
                { name: 'HTML5', category: 'Frontend', icon: 'fab fa-html5' },
                { name: 'CSS3', category: 'Frontend', icon: 'fab fa-css3-alt' },
                { name: 'JavaScript', category: 'Frontend', icon: 'fab fa-js' },
                { name: 'React', category: 'Frontend', icon: 'fab fa-react' },
                { name: 'Vue.js', category: 'Frontend', icon: 'fab fa-vuejs' },
                { name: 'Node.js', category: 'Backend', icon: 'fab fa-node' },
                { name: 'Express', category: 'Backend', icon: 'fas fa-server' },
                { name: 'Python', category: 'Backend', icon: 'fab fa-python' },
                { name: 'MongoDB', category: 'Database', icon: 'fas fa-database' },
                { name: 'MySQL', category: 'Database', icon: 'fas fa-database' },
                { name: 'Git', category: 'Tools', icon: 'fab fa-git-alt' },
                { name: 'Docker', category: 'Tools', icon: 'fab fa-docker' },
                { name: 'AWS', category: 'Tools', icon: 'fab fa-aws' }
            ]);
            console.log('Sample skills seeded');
        }

        // Seed Admin if empty
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            await Admin.create({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123'
            });
            console.log('Admin account created');
        }
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        const skills = await Skill.find().sort({ category: 1, name: 1 });
        res.render('index', { projects, skills });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    console.log('Contact Form Submission:', { name, email, message });

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: `Portfolio Contact Form: Message from ${name}`,
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.send(`<script>alert('Message sent successfully!'); window.location.href='/';</script>`);
    } catch (error) {
        console.error('Error sending email:', error);
        // Sanitize error message to be safe for alert
        const errorMessage = error.message.replace(/['"\n\r]/g, ' ');
        res.send(`<script>alert('Failed to send message: ${errorMessage}'); window.location.href='/';</script>`);
    }
});

// Admin Routes
app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

// Login page
app.get('/admin/login', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { error: null });
});

// Login POST
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        req.session.adminId = admin._id;
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('admin/login', { error: 'An error occurred' });
    }
});

// Dashboard
app.get('/admin/dashboard', requireAuth, async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        const skills = await Skill.find().sort({ category: 1, name: 1 });
        console.log(`Rendering dashboard with ${projects.length} projects and ${skills.length} skills`);
        res.render('admin/dashboard', {
            projects,
            skills,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Server Error');
    }
});



// Add Project - with multer file upload handling
const uploadProjectImage = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.redirect('/admin/dashboard?error=File too large. Maximum size is 5MB');
            } else if (err.message === 'Only image files are allowed!') {
                return res.redirect('/admin/dashboard?error=Only image files are allowed (JPG, PNG, GIF, WebP)');
            } else {
                return res.redirect('/admin/dashboard?error=File upload error: ' + err.message);
            }
        }
        next();
    });
};

app.post('/admin/projects/add', requireAuth, uploadProjectImage, async (req, res) => {
    try {
        const { title, description, imageUrl, tags, link } = req.body;

        // Determine image path: use uploaded file if available, otherwise use URL
        let imagePath;
        if (req.file) {
            // File was uploaded
            imagePath = '/uploads/' + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            // URL was provided
            imagePath = imageUrl;
        } else {
            return res.redirect('/admin/dashboard?error=Please provide either an image file or URL');
        }

        await Project.create({
            title,
            description,
            image: imagePath,
            tags: tags.split(',').map(tag => tag.trim()),
            link
        });
        res.redirect('/admin/dashboard?success=Project added successfully');
    } catch (error) {
        console.error('Add project error:', error);
        const errorMessage = error.message || 'Unknown error occurred';
        res.redirect('/admin/dashboard?error=Failed to add project: ' + errorMessage);
    }
});



// Edit Project - GET (show edit form)
app.get('/admin/projects/edit/:id', requireAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.redirect('/admin/dashboard?error=Project not found');
        }
        res.render('admin/edit-project', { project, error: null, success: null });
    } catch (error) {
        console.error('Get project error:', error);
        res.redirect('/admin/dashboard?error=Failed to load project');
    }
});

// Edit Project - POST (update project)
app.post('/admin/projects/edit/:id', requireAuth, uploadProjectImage, async (req, res) => {
    try {
        const { title, description, imageUrl, tags, link } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.redirect('/admin/dashboard?error=Project not found');
        }

        // Determine image path
        let imagePath = project.image; // Keep existing image by default
        if (req.file) {
            // New file was uploaded
            imagePath = '/uploads/' + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            // New URL was provided
            imagePath = imageUrl;
        }

        await Project.findByIdAndUpdate(req.params.id, {
            title,
            description,
            image: imagePath,
            tags: tags.split(',').map(tag => tag.trim()),
            link
        });

        res.redirect('/admin/dashboard?success=Project updated successfully');
    } catch (error) {
        console.error('Update project error:', error);
        res.redirect('/admin/dashboard?error=Failed to update project');
    }
});

// Delete Project
// Delete Project
app.post('/admin/projects/delete/:id', requireAuth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard?success=Project deleted successfully');
    } catch (error) {
        console.error('Delete project error:', error);
        res.redirect('/admin/dashboard?error=Failed to delete project');
    }
});

// Add Skill
app.post('/admin/skills/add', requireAuth, async (req, res) => {
    try {
        const { name, category, icon } = req.body;
        await Skill.create({ name, category, icon });
        res.redirect('/admin/dashboard?success=Skill added successfully');
    } catch (error) {
        console.error('Add skill error:', error);
        res.redirect('/admin/dashboard?error=Failed to add skill');
    }
});

// Delete Skill
app.post('/admin/skills/delete/:id', requireAuth, async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard?success=Skill deleted successfully');
    } catch (error) {
        console.error('Delete skill error:', error);
        res.redirect('/admin/dashboard?error=Failed to delete skill');
    }
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
