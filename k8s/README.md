# TaborFlow Kubernetes Deployment

This folder contains a first production-oriented Kubernetes setup for TaborFlow.

## Layout

- `base/`: cloud-neutral namespace, config, deployments, services, and Prisma migration job.
- `aws/`: EKS overlay with AWS Load Balancer Controller ingress and ECR image names.

## Before Applying

The manifests use shell-style placeholders such as `${APP_HOST}` and `${IMAGE_TAG}`.
Kubernetes and Kustomize do not replace those values automatically. Render them in CI/CD
or with a local environment-substitution step before applying.

Set these production GitHub Environment variables:

- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- `AWS_ROLE_TO_ASSUME`
- `EKS_CLUSTER_NAME`
- `APP_HOST`
- `API_HOST`
- `ACM_CERTIFICATE_ID`
- `ALB_SUBNET_1`
- `ALB_SUBNET_2`
- `ALB_SUBNET_3`
- `ALB_SUBNET_4`
- `ALB_SUBNET_5`

Set these production GitHub Environment secrets:

- `DATABASE_URL`
- `AUTH_SECRET`

For manual deploys, create the production secret manually or with your secret manager:

```bash
kubectl create secret generic tabor-flow-secrets \
  --namespace tabor-flow \
  --from-literal=DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/taborflow' \
  --from-literal=AUTH_SECRET='replace-with-a-long-random-secret'
```

Do not commit real secret values.

## Build Images

```bash
docker build -t tabor-flow-api:latest ./backend
docker build \
  --build-arg VITE_API_URL=https://api.tabor-flow.example.com/graphql \
  -t tabor-flow-web:latest \
  ./frontend
```

For EKS, tag and push these images to ECR, then update `k8s/aws/kustomization.yaml`.

## Deploy

```bash
kubectl kustomize k8s/aws \
  | python3 -c 'import os, sys; print(os.path.expandvars(sys.stdin.read()))' \
  > rendered.yaml
kubectl apply -f rendered.yaml
```

For production, prefer creating the secret from AWS Secrets Manager or a CI/CD secret store instead of applying `secret.example.yaml`.

## Run Migrations

The base includes a `tabor-flow-migrate` Job. For repeat deployments, delete and recreate it when you need to run migrations again:

```bash
kubectl delete job tabor-flow-migrate -n tabor-flow --ignore-not-found
kubectl apply -k k8s/aws
kubectl logs job/tabor-flow-migrate -n tabor-flow
```

## Useful Checks

```bash
kubectl get pods -n tabor-flow
kubectl get ingress -n tabor-flow
kubectl logs deploy/tabor-flow-api -n tabor-flow
kubectl describe ingress tabor-flow -n tabor-flow
```
