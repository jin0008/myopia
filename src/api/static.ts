import { jsonFetch } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getCountryList() {
  return jsonFetch(API_ROOT + "/static/country");
}

export function getEthnicityList() {
  return jsonFetch(API_ROOT + "/static/ethnicity");
}

export function getInstrumentList() {
  return jsonFetch(API_ROOT + "/static/instrument");
}

export function getTreatmentList() {
  return jsonFetch(API_ROOT + "/static/treatment");
}

export function getRefractiveErrorMethodList() {
  return jsonFetch(API_ROOT + "/static/refractive_error_method");
}
