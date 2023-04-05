pipeline {
    agent any
    tools {
        nodejs "nodejs"
    }
    stages {
        stage('build')
        {
            steps {
                sh 'npm install'
                sh 'pm2 start a1_truck.js'
                sh 'pm2 list'
                sh 'pm2 restart 0'
                sh 'pm2 list'
            }
        }
    }
}