export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

export type AuthResponse = {
  __typename?: 'AuthResponse';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  user: User;
};

export type Company = {
  __typename?: 'Company';
  created_at: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  owner_id: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type CompanyFiltersInput = {
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateCompanyInput = {
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type CreateWarehouseInput = {
  accountable_id?: InputMaybe<Scalars['String']['input']>;
  address: Scalars['String']['input'];
  address_complement?: InputMaybe<Scalars['String']['input']>;
  area_total: Scalars['String']['input'];
  city: Scalars['String']['input'];
  company_id: Scalars['String']['input'];
  country: Scalars['String']['input'];
  description: Scalars['String']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  price: Scalars['String']['input'];
  state: Scalars['String']['input'];
  status?: InputMaybe<WarehouseStatus>;
  title: Scalars['String']['input'];
  zip_code: Scalars['String']['input'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LogoutResponse = {
  __typename?: 'LogoutResponse';
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addCompanyMember?: Maybe<Company>;
  addWarehouseImages?: Maybe<Warehouse>;
  createCompany?: Maybe<Company>;
  createUser: User;
  createWarehouse?: Maybe<Warehouse>;
  login: AuthResponse;
  logout: LogoutResponse;
  logoutAll: LogoutResponse;
  refreshToken: AuthResponse;
  register: AuthResponse;
  removeCompany?: Maybe<Company>;
  removeCompanyMember?: Maybe<Company>;
  removeUser: User;
  removeWarehouse?: Maybe<Warehouse>;
  removeWarehouseImage?: Maybe<Warehouse>;
  updateCompany?: Maybe<Company>;
  updatePassword: User;
  updateProfile: User;
  updateUser: User;
  updateUserRole: User;
  updateWarehouse?: Maybe<Warehouse>;
};


export type MutationAddCompanyMemberArgs = {
  company_id: Scalars['String']['input'];
  user_id: Scalars['String']['input'];
};


export type MutationAddWarehouseImagesArgs = {
  id: Scalars['String']['input'];
  imageUrls: Array<Scalars['String']['input']>;
};


export type MutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateWarehouseArgs = {
  input: CreateWarehouseInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationLogoutArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  input: CreateUserInput;
};


export type MutationRemoveCompanyArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveCompanyMemberArgs = {
  company_id: Scalars['String']['input'];
  user_id: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveWarehouseArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveWarehouseImageArgs = {
  id: Scalars['String']['input'];
  imageUrl: Scalars['String']['input'];
};


export type MutationUpdateCompanyArgs = {
  input: UpdateCompanyInput;
};


export type MutationUpdatePasswordArgs = {
  input: UpdatePasswordInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserRoleArgs = {
  input: UpdateUserRoleInput;
};


export type MutationUpdateWarehouseArgs = {
  input: UpdateWarehouseInput;
};

export type PaginatedCompaniesResponse = {
  __typename?: 'PaginatedCompaniesResponse';
  companies: Array<Company>;
  info: PaginationInfo;
};

export type PaginatedUsersResponse = {
  __typename?: 'PaginatedUsersResponse';
  info: PaginationInfo;
  users: Array<User>;
};

export type PaginatedWarehousesResponse = {
  __typename?: 'PaginatedWarehousesResponse';
  info: PaginationInfo;
  warehouses: Array<Warehouse>;
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  page: Scalars['Int']['output'];
  take: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  total_pages: Scalars['Int']['output'];
};

export type PaginationInput = {
  page?: Scalars['Int']['input'];
  take?: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  companies?: Maybe<PaginatedCompaniesResponse>;
  companiesCount: Scalars['Int']['output'];
  company?: Maybe<Company>;
  getAllUsers: PaginatedUsersResponse;
  getMe: User;
  getMyCompanies?: Maybe<PaginatedCompaniesResponse>;
  getUserById: User;
  myWarehouses?: Maybe<PaginatedWarehousesResponse>;
  warehouse?: Maybe<Warehouse>;
  warehouses?: Maybe<PaginatedWarehousesResponse>;
  warehousesCount: Scalars['Int']['output'];
};


export type QueryCompaniesArgs = {
  filters?: InputMaybe<CompanyFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryCompaniesCountArgs = {
  filters?: InputMaybe<CompanyFiltersInput>;
};


export type QueryCompanyArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetAllUsersArgs = {
  filters?: InputMaybe<UserFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetMyCompaniesArgs = {
  filters?: InputMaybe<CompanyFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetUserByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryMyWarehousesArgs = {
  filters?: InputMaybe<WarehouseFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryWarehouseArgs = {
  id: Scalars['String']['input'];
};


export type QueryWarehousesArgs = {
  filters?: InputMaybe<WarehouseFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryWarehousesCountArgs = {
  filters?: InputMaybe<WarehouseFiltersInput>;
};

export enum Role {
  Admin = 'ADMIN',
  Investor = 'INVESTOR',
  InvestorAdmin = 'INVESTOR_ADMIN'
}

export type UpdateCompanyInput = {
  id: Scalars['String']['input'];
  logo?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type UpdateProfileInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Role>;
  userId: Scalars['String']['input'];
};

export type UpdateUserRoleInput = {
  role: Role;
  userId: Scalars['String']['input'];
};

export type UpdateWarehouseInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  address_complement?: InputMaybe<Scalars['String']['input']>;
  area_total?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  price?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<WarehouseStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
  zip_code?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  created_at: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Role;
  updated_at: Scalars['DateTime']['output'];
};

export type UserFiltersInput = {
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Warehouse = {
  __typename?: 'Warehouse';
  accountable_id: Scalars['String']['output'];
  address: Scalars['String']['output'];
  address_complement?: Maybe<Scalars['String']['output']>;
  area_total: Scalars['String']['output'];
  city: Scalars['String']['output'];
  company?: Maybe<Company>;
  company_id: Scalars['String']['output'];
  country: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images: Array<Scalars['String']['output']>;
  price: Scalars['String']['output'];
  state: Scalars['String']['output'];
  status: WarehouseStatus;
  title: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
  zip_code: Scalars['String']['output'];
};

export type WarehouseFiltersInput = {
  region?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<WarehouseStatus>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export enum WarehouseStatus {
  Available = 'AVAILABLE',
  Unavailable = 'UNAVAILABLE'
}
