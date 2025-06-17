#!/bin/bash

# Check if token is set in sonar-project.properties
TOKEN_VALUE=$(grep "sonar.token" sonar-project.properties | cut -d= -f2)

if [ "$TOKEN_VALUE" = "YOUR_TOKEN" ]; then
    echo "ERROR: Please update your sonar-project.properties file with your SonarQube token."
    echo "1. Go to http://localhost:9000 and log in"
    echo "2. Navigate to My Account > Security > Generate Tokens"
    echo "3. Create a token named 'scan-token'"
    echo "4. Copy the token and update the sonar.token property in sonar-project.properties"
    exit 1
fi

# Check if a module name was provided
if [ -z "$1" ]; then
    echo "Usage:"
    echo "  ./scan-module.sh <module_name>   - To scan a specific module"
    echo "  ./scan-module.sh all             - To scan the entire project"
    echo ""
    echo "Example: ./scan-module.sh user"
    exit 1
fi

MODULE_NAME=$1

# If "all" is specified, scan the entire project
if [ "$MODULE_NAME" = "all" ]; then
    echo "Scanning the entire project..."
    # No need to modify properties file, use it as is
    sonar-scanner
    echo "Scan complete. You can view the results at: http://localhost:9000/dashboard?id=test-vista"
    exit 0
fi

MODULE_PATH="src/modules/$MODULE_NAME"

# Check if the module directory exists
if [ ! -d "$MODULE_PATH" ]; then
    echo "Error: Module directory '$MODULE_PATH' does not exist."
    echo "Available modules:"
    ls -1 src/modules/
    echo ""
    echo "Or use 'all' to scan the entire project:"
    echo "  ./scan-module.sh all"
    exit 1
fi

echo "Scanning module: $MODULE_NAME"
echo "Module path: $MODULE_PATH"

# Backup the original sonar-project.properties
cp sonar-project.properties sonar-project.properties.bak

# Update the sonar.sources property to point to the module directory
sed -i "s|sonar.sources=src|sonar.sources=$MODULE_PATH|" sonar-project.properties

# Run the SonarQube scanner
sonar-scanner

# Restore the original sonar-project.properties
mv sonar-project.properties.bak sonar-project.properties

echo "Scan complete. You can view the results at: http://localhost:9000/dashboard?id=test-vista"
echo "Look in the 'Files' tab to see the analysis of the $MODULE_NAME module." 