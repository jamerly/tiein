# Tie-in Protocol Hub

Welcome to the Tie-in Protocol Hub, a comprehensive platform for developing, managing, and deploying AI-powered tools and agents using the Model Context Protocol (MCP).

This monorepo contains the core components of the Tie-in ecosystem: a powerful web-based management frontend, a robust Java backend server, and a flexible Python SDK for creating custom MCP tools and clients.

## Project Components

The project is divided into three main parts, located in their respective directories:

-   **`/frontend`**: A modern, responsive web application built with React and TypeScript. It provides a user-friendly interface for managing all aspects of the MCP ecosystem, including tools, prompts, resources, users, and system settings.
-   **`/server`**: The core backend API server built with Java and Spring Boot. It handles business logic, data persistence, and serves as the central hub for all MCP interactions.
-   **`/python-sdk`**: A Python SDK for the Model Context Protocol (MCP). It allows developers to easily build and integrate their own tools and clients with any MCP-compliant server.

## Features

-   **Tool Management**: Register, configure, and manage custom tools for your AI agents.
    -   Support for both HTTP and Groovy tools.
    -   Define input and output schemas for tools using JSON Schema.
    -   Associate tools with groups for better organization.
-   **Worker Management**: Manage Groovy scripts as "workers" that can be executed by tools.
    -   Use AI to generate Groovy scripts from a text prompt.
-   **Prompt Management**: Create, organize, and version control prompts to guide AI interactions.
-   **Resource Management**: Connect and manage data sources and other resources for your tools.
-   **User & Access Control**: Secure your platform with user authentication and role-based access.
-   **System Settings**: Configure and monitor the health and performance of the entire system.
-   **Real-time Chat**: Interact with the AI in real-time using a chat interface powered by Server-Sent Events (SSE).
-   **Extensible SDK**: Use the Python SDK to build powerful, custom integrations.

## Architecture

### Backend

The backend is a Spring Boot application that provides a REST API for the frontend and the Python SDK. It uses a service-oriented architecture with a clear separation of concerns between controllers, services, and repositories.

-   **Controllers:** Handle incoming HTTP requests and delegate the business logic to the services.
-   **Services:** Contain the business logic of the application.
-   **Repositories:** Handle the communication with the database.

The backend uses Spring Data JPA for database access and it's configured to work with a MySQL database. It also uses Spring Security for authentication and authorization, with JWTs for token-based authentication.

### Frontend

The frontend is a React application built with Vite. It uses React Router for routing and Material-UI for the UI components.

-   **Components:** Reusable UI components.
-   **Pages:** The different pages of the application.
-   **Services:** Functions for interacting with the backend API.
-   **Context:** The `AuthContext` is used to manage the authentication state of the application.

## Getting Started

To get the full platform running, you will need to set up each component.

### Prerequisites

-   [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (for the frontend)
-   [Java 21+](https://www.oracle.com/java/technologies/downloads/) and [Maven](https://maven.apache.org/) (for the server)
-   [Python 3.10+](https://www.python.org/) and a package manager like `pip` or `uv` (for the SDK)
-   A MySQL database.

### Installation & Running

#### 1. Backend Server

The server is the central component and should be started first.

1.  **Configure the database:**
    *   Open the `server/src/main/resources/application.properties` file.
    *   Update the `spring.datasource.url`, `spring.datasource.username`, and `spring.datasource.password` properties to match your MySQL database configuration.
2.  **Build and run the application:**
    ```bash
    # Navigate to the server directory
    cd server

    # Build and run the Spring Boot application
    mvn spring-boot:run
    ```

The server will start on the port configured in its properties (default is typically 8080).

#### 2. Frontend

The frontend provides the management UI.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

#### 3. Python SDK

The Python SDK allows you to create tools that can be managed by the platform.

```bash
# Navigate to the Python SDK directory
cd python-sdk

# We recommend using a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install the SDK and its dependencies
pip install -e ".[cli]"
```

Refer to the detailed `README.md` inside the `python-sdk` directory for instructions on how to create and run your own MCP servers.

## API Documentation

The backend provides a REST API for managing the different entities of the application. Here are some of the main endpoints:

-   `/user`: User management and authentication.
-   `/mcp/tools`: CRUD operations for tools.
-   `/mcp/workers`: CRUD operations for workers.
-   `/mcp/groups`: CRUD operations for groups.
-   `/mcp/prompts`: CRUD operations for prompts.
-   `/mcp/resources`: CRUD operations for resources.
-   `/chat/openai`: Real-time chat with the AI.
-   `/admin/settings`: Manage system settings.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
