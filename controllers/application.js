const Applications = require("../models/applicationModel");
const cloudinary = require("../config/cloudinary");
const applyHandler = async (req, res) => {

  try {
    const {propertyId} = req.body
      if (!propertyId) {
        return res.status(400).json({error : "property id is required"})
      }
    const findUser = await Applications.findOne({ email: req.body.email })
    if (findUser) {
        return res.status(400).json({error : "Email already applied"})
    }
 
    const IdDocument = await Promise.all(
      req.files.idDoc.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        return {
          url: result.secure_url,
        };
      }),
    )
    
    const AddressDoc = await Promise.all(
      req.files.addressDoc.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        return {
          url: result.secure_url,
        };
      }),
    );

    const RecentPaymentSLip = await Promise.all(
      req.files.recent_payment_slip.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        return {
          url: result.secure_url,
          public_id: result?.public_id,
          resourceType: file?.mimetype,
        };
      }),
    );

    const RecentBankStatement = await Promise.all(
      req.files.recent_bank_statement.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        return {
          url: result.secure_url,
          public_id: result?.public_id,
          resourceType: file?.mimetype,
        };
      }),
    );

    const RecentProofIncome = await Promise.all(
      req.files.proof_of_income.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        return {
          url: result.secure_url,
          public_id: result?.public_id,
          resourceType: file?.mimetype,
        };
      }),
    );
    const applications = await new Applications({
      idDoc: IdDocument[0]?.url,
      addressDoc: AddressDoc[0]?.url,
      recent_payment_slip: RecentPaymentSLip,
      recent_bank_statement: RecentBankStatement,
      proof_of_income: RecentProofIncome,
      propertyId: req.body.propertyId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ...(req.body.middleName && { middleName: req.body.middleName }),
      dob: req.body.dob,
      country: req.body.country,
      ...(req.body.nationalInsuranceNumber && {
        nationalInsuranceNumber: req.body.nationalInsuranceNumber,
      }),
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      postalcode: req.body.postalcode,
      reasonforleaving: req.body.reasonforleaving,
      ...(req.body.previousAddress && {
        previousAddress: req.body.previousAddress,
      }),
      idType: req.body.idType,
      idNumber: req.body.idNumber,
      residencyStatus: req.body.residencyStatus,
      ...(req.body.shareCode && { shareCode: req.body.shareCode }),
      consent_to_rent: req.body.consent_to_rent === "true",
      employmentStatus: req.body.employmentStatus,
      jobTitle: req.body.jobTitle,
      ...(req.body.employer_name && { employer_name: req.body.employer_name }),
      ...(req.body.employer_address && {
        employer_address: req.body.employer_address,
      }),
      length_of_employment_year: Number(req.body.length_of_employment_year),
      length_of_employment_month: Number(req.body.length_of_employment_month),
      monthly_income: Number(req.body.monthly_income),
      annual_income: Number(req.body.annual_income),
      move_in_date: req.body.move_in_date,
      preferred_tenancy_length: req.body.preferred_tenancy_length,
      number_of_tenant: Number(req.body.number_of_tenant),
      ...(req.body.names_of_coTenants && {
        names_of_coTenants: req.body.names_of_coTenants,
      }),
      pets: req.body.pets,
      smoke: req.body.smoke,
      require_parking: req.body.require_parking,
      ...(req.body.special_request && {
        special_request: req.body.special_request,
      }),
      ccjs: req.body.ccjs,
      bankrupt: req.body.bankrupt,
      housing_benefit: req.body.housing_benefit,
      consent_credit_check: req.body.consent_credit_check,
      ...(req.body.recent_landlord_name && {
        recent_landlord_name: req.body.recent_landlord_name,
      }),
      ...(req.body.recent_landlord_email && {
        recent_landlord_email: req.body.recent_landlord_email,
      }),
      ...(req.body.recent_landlord_duration_of_tenancy && {
        recent_landlord_duration_of_tenancy:
          req.body.recent_landlord_duration_of_tenancy,
        }),
       ...(req.body.recent_landlord_rent_paid && {
        recent_landlord_rent_paid:
          req.body.recent_landlord_rent_paid,
        }),
        ...(req.body.reference_name && {
        reference_name:
          req.body.reference_name,
        }),
         ...(req.body.reference_relationship && {
        reference_relationship:
          req.body.reference_relationship,
        }),
           ...(req.body.reference_email && {
        reference_email:
          req.body.reference_email,
        }),
              ...(req.body.reference_years_known && {
        reference_years_known:
          req.body.reference_years_known,
        }),
        ...(req.body.guarantor && { guarantor: req.body.guarantor }),
        consent_contact_landlord: req.body.consent_contact_landlord === "true",
        all_info_is_true: req.body.all_info_is_true === "true",
        agree_to_policy: req.body.agree_to_policy === "true",
     
              signature : req.body.signature
    });
      
      await applications.save()
      res.status(200).json({data : applications})

  } catch (error) {
    console.log(error)
    if (error?.name === "ValidationError") {
      return res
        .status(400)
        .json({
          error: Object.values(error?.errors).map((err) => err?.message),
        });
    }
    if (error?.http_code) {
  return res.status(502).json({
    error: "File upload failed. Please try again.",
  });
}
    if (error?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key found" });
    }
      
    return res.status(500).json({ error: "Server error" });
  }
};

const getApplications = async (req, res) => {
  try {
 const { _id } = req.user
  const {propertyId} = req.params
  if (!_id) {
    return res.status(401).json({error: "Unauthorized"})
  }
  if (!propertyId) {
     return res.status(400).json({error: "Property Id is required"})
  }

  const applications = await Applications.find({ propertyId })
  
  res.status(200).json({data : applications})
  } catch (error) {
    console.log(error)
    return res.status(500).json({error : "Server error"})
  }
 
}
module.exports = {
  applyHandler,
  getApplications
};
