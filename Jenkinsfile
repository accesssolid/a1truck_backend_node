pipeline {
    agent any
    tool {
    nodejs "nodejs"
    }
    stages {
        stage('node modules installation') {
            steps {
                echo 'module installtion'
                sh 'npm install'
                echo 'istallation complete'
                sh 'pm2 start a1_truck.js'
                echo 'service started'
                sh 'pm2 list'
                echo 'service running list'
            }
        }
    }
}
