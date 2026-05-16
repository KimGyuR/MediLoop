# MediLoop

MediLoop is a healthcare support project with a Spring Boot backend and a React Native Expo frontend.

## Project Structure

- `backend/`
  - Spring Boot API
  - AI-based symptom analysis, hospital recommendation, Fill Bag analysis
- `seungyoon/`
  - Main React Native Expo app
  - Home / Hospital / Fill Bag / Profile flows
- `MediLoop/`
  - Older experiment and archive folders kept in the repository

## Main App

The actively used mobile app in this repository is:

- `seungyoon/`

## Run Backend

From the repository root:

```powershell
cd backend
.\.tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

Backend default URL:

- `http://localhost:8080`

Health check:

- `GET /api/health`

## Run Frontend

From the repository root:

```powershell
cd seungyoon
npm install
npx expo start
```

If Metro cache gets messy:

```powershell
npx expo start --clear
```

## Notes

- The app uses AI-backed analysis for symptoms and prescription follow-up flows.
- Local secret files such as `backend/src/main/resources/application-secrets.properties` are intentionally not tracked in GitHub.
