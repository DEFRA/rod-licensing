export class ContactByLicenceAndPostcode {
  /**
   * Represents the contact details returned from the CRM plugin
   * @param {Object} data - The raw data returned from the CRM response
   * @param {string|null} data.ContactId - The contact's unique identifier
   * @param {string|null} data.FirstName - The contact's first name
   * @param {string|null} data.LastName - The contact's last name
   * @param {string|null} data.DateOfBirth - The contact's date of birth
   * @param {string|null} data.Premises - The contact's premises (house number)
   * @param {string|null} data.Street - The contact's street
   * @param {string|null} data.Town - The contact's town
   * @param {string|null} data.Locality - The contact's locality
   * @param {string|null} data.Postcode - The contact's postcode
   * @param {string} data.ReturnStatus - The status of the request (e.g., "success" or "error")
   * @param {string|null} data.SuccessMessage - A success message if the contact is found
   * @param {string|null} data.ErrorMessage - An error message if the contact is not found
   * @param {string|null} data.ReturnPermissionNumber - The full permission number of the contact
   * @param {string} data.oDataContext - The OData context URL
   */
  constructor ({
    ContactId,
    FirstName,
    LastName,
    DateOfBirth,
    Premises,
    Street,
    Town,
    Locality,
    Postcode,
    ReturnStatus,
    SuccessMessage,
    ErrorMessage,
    ReturnPermissionNumber,
    oDataContext
  }) {
    this.ContactId = ContactId
    this.FirstName = FirstName
    this.LastName = LastName
    this.DateOfBirth = DateOfBirth
    this.Premises = Premises
    this.Street = Street
    this.Town = Town
    this.Locality = Locality
    this.Postcode = Postcode
    this.ReturnStatus = ReturnStatus
    this.SuccessMessage = SuccessMessage
    this.ErrorMessage = ErrorMessage
    this.ReturnPermissionNumber = ReturnPermissionNumber
    this.ODataContext = oDataContext
  }
}
