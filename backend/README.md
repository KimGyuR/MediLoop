# MediLoop Backend

## API key input location

Paste your OpenAI key into:

`backend/src/main/resources/application-secrets.properties`

Example:

```properties
openai.api-key=sk-proj-...
```

## Run

```bash
mvn spring-boot:run
```

## Endpoints

- `POST /api/home/analyze`
- `POST /api/hospital/analyze`
- `POST /api/location/recommend`
- `GET /api/health`
