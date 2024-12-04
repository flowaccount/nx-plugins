export class CertificateManagerActions {
  // list actions
  static readonly ListCertificates = 'acm:ListCertificates';

  // read actions
  static readonly DescribeCertificate = 'acm:DescribeCertificate';
  static readonly ExportCertificate = 'acm:ExportCertificate';
  static readonly GetAccountConfiguration = 'acm:GetAccountConfiguration';
  static readonly GetCertificate = 'acm:GetCertificate';
  static readonly ListTagsForCertificate = 'acm:ListTagsForCertificate';
  
  // write actions
  static readonly DeleteCertificate = 'acm:DeleteCertificate';
  static readonly ImportCertificate = 'acm:ImportCertificate';
  static readonly PutAccountConfiguration = 'acm:PutAccountConfiguration';
  static readonly RenewCertificate = 'acm:RenewCertificate';
  static readonly RequestCertificate = 'acm:RequestCertificate';
  static readonly ResendValidationEmail = 'acm:ResendValidationEmail';
  static readonly UpdateCertificateOptions = 'acm:UpdateCertificateOptions';
  
  // tag actions
  static readonly AddTagsToCertificate = 'acm:AddTagsToCertificate';
  static readonly RemoveTagsFromCertificate = 'acm:RemoveTagsFromCertificate';

  // star actions
  static readonly GetAll = 'acm:Get*';
  static readonly ListAll = 'acm:List*';
}
