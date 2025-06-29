# DevContainer Setup for Futurity Frontend

This DevContainer configuration allows you to develop and test your Vite application in a containerized environment that closely matches your production Elastic Beanstalk deployment.

## Features

- **Dual Mode Testing**: Test both development (Vite dev server) and production (serve) modes
- **Consistent Environment**: Uses the same Node.js Alpine image as production
- **Full Debugging Support**: Chrome debugging for both dev and production builds
- **Pre-configured VS Code**: Includes relevant extensions and settings

## Getting Started

1. **Open in DevContainer**: 
   - In VS Code, press `F1` and select "Dev Containers: Reopen in Container"
   - Or click the green button in the bottom-left corner and select "Reopen in Container"

2. **Wait for Setup**: The container will automatically run `npm install` after creation

## Available Commands

### Development Mode
```bash
# Start Vite dev server (port 5173)
npm run dev
```

### Production Mode (matches Elastic Beanstalk)
```bash
# Build and serve production build (port 8080)
npm run build && npx serve -s dist -l 8080
```

## Debugging Options

### From VS Code Debug Panel:

1. **Debug Development Server**: Launches Chrome against Vite dev server
2. **Debug Production Build**: Builds and launches Chrome against production server
3. **Dev Server + Chrome Debug**: Starts dev server and attaches debugger
4. **Production Server + Chrome Debug**: Builds, serves, and attaches debugger

### Manual Debugging:

1. Start either dev or production server
2. Go to Debug panel and select "Attach to Chrome"
3. Launch Chrome with remote debugging: `chrome --remote-debugging-port=9222`

## Port Forwarding

- **5173**: Vite development server
- **8080**: Production server (matches Elastic Beanstalk)

Both ports are automatically forwarded when the container starts.

## Testing Production Build

To test exactly as it runs on Elastic Beanstalk:

```bash
# Build the application
npm run build

# Serve using the same command as Dockerfile
serve -s dist -l 8080
```

Then navigate to http://localhost:8080

## Troubleshooting

- If changes aren't reflected in the container, rebuild: "Dev Containers: Rebuild Container"
- For permission issues, the container runs as the `node` user by default
- Check the terminal output for any npm install or build errors
- If you see "apt-get: command not found" errors, ensure you're using the Alpine-compatible Dockerfile

### Common Issues

1. **Build failures with features**: The container uses Alpine Linux which doesn't support some DevContainer features that require apt-get. All necessary tools are pre-installed in the Dockerfile instead.

2. **Port already in use**: If ports 5173 or 8080 are already in use on your host, you may need to stop other services or modify the port mappings.

## Differences from Production

- Development dependencies are installed (for debugging/linting)
- Source code is mounted as a volume (not copied)
- Additional development tools (git, bash, github-cli) are included
- Uses Alpine Linux (same as production) for consistency