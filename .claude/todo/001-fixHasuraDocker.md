See /hasura folder and try to understand why I can't run it locally in container?

klarity@kaspar-mac hasura % docker-compose up -d  
[+] Running 3/3
 ✔ Network hasura_default             Created                                                                                                                                                                                               0.0s 
 ✔ Container hasura-postgres-1        Healthy                                                                                                                                                                                               5.7s 
 ✔ Container hasura-graphql-engine-1  Started                                                                                                                                                                                               5.7s 
klarity@kaspar-mac hasura % hasura console        
ERRO connecting to graphql-engine server failed   
INFO possible reasons:                            
INFO 1) Provided root endpoint of graphql-engine server is wrong. Verify endpoint key in config.yaml or/and value of --endpoint flag 
INFO 2) Endpoint should NOT be your GraphQL API, ie endpoint is NOT https://hasura-cloud-app.io/v1/graphql it should be: https://hasura-cloud-app.io 
INFO 3) Server might be unhealthy and is not running/accepting API requests 
INFO 4) Admin secret is not correct/set           
INFO                                              
FATA[0000] making http request failed: Get "http://localhost:8080/v1/version": dial tcp [::1]:8080: connect: connection refused 

## Root Cause

Port mismatch between `docker-compose.yml` and `config.yaml`:

- `docker-compose.yml` maps graphql-engine to host port **3001** (`"3001:8080"`)
- `config.yaml` had `endpoint: http://localhost:8080` — wrong port

## Fix Applied

Updated `config.yaml`: `endpoint: http://localhost:8080` → `endpoint: http://localhost:3001`

## Verification

Run `cd hasura && hasura console` — should connect successfully at http://localhost:9695
