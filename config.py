class Config():
     DEBUG = False
     SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):
     SQLALCHEMY_DATABASE_URI = 'sqlite:///household.db'
     DEBUG = True

     SECRET_KEY = 'helloworld' # hash user credentials in the session
     SECURITY_PASSWORD_HASH = 'bcrypt' # mechanism for hashing password
     SECURITY_PASSWORD_SALT = 'salt' # helps in hashing the password
     WTF_CSRF_ENABLED = False
     SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
