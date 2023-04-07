pipeline {
    agent any
    tools {
        nodejs "nodejs"
    }
    stages {
        stage('node modules installation') {
            steps {
                echo 'module installation'
                sh 'npm install'
                echo 'installation complete'
                sh 'pm2 start index.js'
                echo 'service started'
                sh 'pm2 list'
                echo 'service running list'
            }
        }
        stage('restart service') {
            steps {
                echo 'Restarting service...'
                sh 'pm2 restart -f index.js' // Restart the PM2 process for the index.js script
                echo 'Service restarted'
                sh 'pm2 list'
                echo 'Updated service running list'
            }
        }
    }
}