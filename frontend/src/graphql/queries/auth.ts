import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        emailVerified
      }
    }
  }
`;
export const REGISTER_MUTATION = gql`mutation Register($name:String!,$organizationName:String!,$email:String!,$password:String!){register(name:$name,organizationName:$organizationName,email:$email,password:$password){token user{id name email role emailVerified}}}`;
export const GOOGLE_LOGIN_MUTATION = gql`mutation GoogleLogin($credential:String!){loginWithGoogle(credential:$credential){token user{id name email role emailVerified}}}`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const RESEND_VERIFICATION_EMAIL_MUTATION = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
      emailVerified
    }
  }
`;

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      name
      email
      role
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      role
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
    }
  }
`;

export const UPDATE_MY_PASSWORD_MUTATION = gql`
  mutation UpdateMyPassword($input: UpdateMyPasswordInput!) {
    updateMyPassword(input: $input)
  }
`;
