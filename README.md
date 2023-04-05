

## Start Project (Cloud Functions) Locally
```
firebase emulators:start
```

## Making Deployments
```
firebase deploy --only functions
```

## Setting Environment Varialbles
```
firebase functions:config:set environment.firebase_token="<value>"
```
## Getting Environment Varialbles
```
firebase functions:config:get environment.firebase_token
```