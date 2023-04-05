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
                       sh 'npm install -g pm2'
                       sh 'pm2 start -f index.js'
                      
                       }
                    }
               }
}