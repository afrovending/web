export default interface Address {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  dialCode?: string;
  lat?: number;
  lng?: number;
}
