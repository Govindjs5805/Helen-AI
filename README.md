# Helen AI

**Helen AI** is a full-stack AI-powered adaptive learning platform designed to provide an inclusive, personalized, and accessible learning experience for students with diverse accessibility requirements. The platform combines Artificial Intelligence, adaptive user interfaces, and learning analytics to simplify educational content, support multiple learning needs, and assist educators in monitoring student progress.

Unlike conventional assistive technologies that address a single accessibility challenge, Helen AI provides a unified platform capable of adapting to combinations of learning disabilities such as Dyslexia, ADHD, Autism Spectrum Disorder (ASD), visual impairment, hearing impairment, and motor disabilities.

---

## Overview

Helen AI aims to bridge the gap between accessibility and modern education by integrating AI-powered learning assistance with adaptive accessibility features. The platform personalizes educational content according to each learner's accessibility profile while providing teachers with insights into student engagement and academic progress.

---

## Key Features

- Personalized accessibility profiles
- Adaptive user interface
- AI-powered study assistant
- Intelligent document simplification
- Optical Character Recognition (OCR)
- Smart note generation
- AI-generated flashcards
- Adaptive quiz generation
- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- Reading assistance
- Personalized learning plans
- Memory reinforcement
- Progress analytics
- Teacher dashboard
- Accessibility analytics

---

## System Architecture

```
                    Student / Teacher
                           │
                           ▼
                 React Frontend (Vite)
                           │
                           ▼
                    FastAPI Backend
               ┌───────────┴───────────┐
               ▼                       ▼
        Google Gemini API         Firebase
        AI Processing      Authentication & Firestore
               │                       │
               └───────────┬───────────┘
                           ▼
              Personalized Learning Engine
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Smart Notes      AI Assistant    Adaptive Quiz
                           │
                           ▼
                  Analytics Dashboard
```

---

## Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Framer Motion
- React Router

### Backend

- FastAPI
- Python

### Database

- Cloud Firestore
- Firebase Storage

### Authentication

- Firebase Authentication

### Artificial Intelligence

- Google Gemini API
- OCR Processing

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Figma

### Deployment

- Vercel
- Render

---

## Project Structure

```
Helen-AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── docs/
├── README.md
└── LICENSE
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/Helen-AI.git
cd Helen-AI
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BACKEND_URL=
```

### Backend (.env)

```env
GEMINI_API_KEY=
FIREBASE_CREDENTIALS=
SECRET_KEY=
```

---

## Core Modules

- User Authentication
- Accessibility Profile Management
- AI Study Assistant
- AI Document Simplification
- OCR Service
- Smart Notes Generator
- Adaptive Quiz Generator
- Homework Assistance
- Learning Planner
- Progress Analytics
- Teacher Dashboard
- Accessibility Analytics

---

## Target Users

- School Students
- University Students
- Teachers
- Educational Institutions
- Special Education Centres
- Non-Governmental Organisations
- Government Education Departments

---

## Development Roadmap

| Phase | Status |
|--------|--------|
| Requirement Analysis | Completed |
| UI/UX Design | Completed |
| Authentication Module | In Progress |
| AI Study Assistant | Planned |
| Document Simplification | Planned |
| OCR Integration | Planned |
| Smart Notes | Planned |
| Adaptive Quiz Generator | Planned |
| Learning Analytics | Planned |
| Teacher Dashboard | Planned |
| Deployment | Planned |

---

## Future Enhancements

- Voice-enabled AI assistant
- Multilingual learning support
- Handwritten document recognition
- Mobile application
- Offline AI support
- AI-based career guidance
- Learning behaviour prediction
- LMS integration
- Advanced accessibility recommendations

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature-name
```

3. Commit your changes.

```bash
git commit -m "Describe your changes"
```

4. Push the branch.

```bash
git push origin feature-name
```

5. Open a Pull Request.

---

## License

This project is released under the MIT License.

---

## Team

Helen AI Development Team

Department of Computer Science and Engineering

---

## Contact

For questions, suggestions, or collaborations, please open an issue in this repository or contact the development team.

---

*"Making education accessible through adaptive artificial intelligence."*
