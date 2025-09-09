export class LambdaActions {
    // list actions
    static readonly ListAliases = 'lambda:ListAliases';
    static readonly ListCodeSigningConfigs = 'lambda:ListCodeSigningConfigs';
    static readonly ListEventSourceMappings = 'lambda:ListEventSourceMappings';
    static readonly ListFunctionEventInvokeConfigs = 'lambda:ListFunctionEventInvokeConfigs';
    static readonly ListFunctions = 'lambda:ListFunctions';
    static readonly ListFunctionsByCodeSigningConfig = 'lambda:ListFunctionsByCodeSigningConfig';
    static readonly ListFunctionUrlConfigs = 'lambda:ListFunctionUrlConfigs';
    static readonly ListLayers = 'lambda:ListLayers';
    static readonly ListLayerVersions = 'lambda:ListLayerVersions';
    static readonly ListProvisionedConcurrencyConfigs = 'lambda:ListProvisionedConcurrencyConfigs';
    static readonly ListVersionsByFunction = 'lambda:ListVersionsByFunction';

    // read actions
    static readonly ListTags = 'lambda:ListTags';
    static readonly GetAccountSettings = 'lambda:GetAccountSettings';
    static readonly GetAlias = 'lambda:GetAlias';
    static readonly GetCodeSigningConfig = 'lambda:GetCodeSigningConfig';
    static readonly GetEventSourceMapping = 'lambda:GetEventSourceMapping';
    static readonly GetFunction = 'lambda:GetFunction';
    static readonly GetFunctionCodeSigningConfig = 'lambda:GetFunctionCodeSigningConfig';
    static readonly GetFunctionConcurrency = 'lambda:GetFunctionConcurrency';
    static readonly GetFunctionConfiguration = 'lambda:GetFunctionConfiguration';
    static readonly GetFunctionEventInvokeConfig = 'lambda:GetFunctionEventInvokeConfig';
    static readonly GetFunctionRecursionConfig = 'lambda:GetFunctionRecursionConfig';
    static readonly GetFunctionUrlConfig = 'lambda:GetFunctionUrlConfig';
    static readonly GetLayerVersion = 'lambda:GetLayerVersion';
    static readonly GetLayerVersionByArn = 'lambda:GetLayerVersionByArn';
    static readonly GetLayerVersionPolicy = 'lambda:GetLayerVersionPolicy';
    static readonly GetPolicy = 'lambda:GetPolicy';
    static readonly GetProvisionedConcurrencyConfig = 'lambda:GetProvisionedConcurrencyConfig';
    static readonly GetRuntimeManagementConfig = 'lambda:GetRuntimeManagementConfig';

    // write actions
    static readonly CreateAlias = 'lambda:CreateAlias';
    static readonly CreateCodeSigningConfig = 'lambda:CreateCodeSigningConfig';
    static readonly CreateEventSourceMapping = 'lambda:CreateEventSourceMapping';
    static readonly CreateFunction = 'lambda:CreateFunction';
    static readonly CreateFunctionUrlConfig = 'lambda:CreateFunctionUrlConfig';
    static readonly DeleteAlias = 'lambda:DeleteAlias';
    static readonly DeleteCodeSigningConfig = 'lambda:DeleteCodeSigningConfig';
    static readonly DeleteEventSourceMapping = 'lambda:DeleteEventSourceMapping';
    static readonly DeleteFunction = 'lambda:DeleteFunction';
    static readonly DeleteFunctionCodeSigningConfig = 'lambda:DeleteFunctionCodeSigningConfig';
    static readonly DeleteFunctionConcurrency = 'lambda:DeleteFunctionConcurrency';
    static readonly DeleteFunctionEventInvokeConfig = 'lambda:DeleteFunctionEventInvokeConfig';
    static readonly DeleteFunctionUrlConfig = 'lambda:DeleteFunctionUrlConfig';
    static readonly DeleteLayerVersion = 'lambda:DeleteLayerVersion';
    static readonly DeleteProvisionedConcurrencyConfig = 'lambda:DeleteProvisionedConcurrencyConfig';
    static readonly Invoke = 'lambda:Invoke';
    static readonly InvokeAsync = 'lambda:InvokeAsync';
    static readonly InvokeFuction = 'lambda:InvokeFuction';
    static readonly InvokeFuctionUrl = 'lambda:InvokeFuctionUrl';
    static readonly InvokeWithResponseStream = 'lambda:InvokeWithResponseStream';
    static readonly PublishLayerVersion = 'lambda:PublishLayerVersion';
    static readonly PublishVersion = 'lambda:PublishVersion';
    static readonly PutFunctionCodeSigningConfig = 'lambda:PutFunctionCodeSigningConfig';
    static readonly PutFunctionConcurrency = 'lambda:PutFunctionConcurrency';
    static readonly PutFunctionEventInvokeConfig = 'lambda:PutFunctionEventInvokeConfig';
    static readonly PutFunctionRecursionConfig = 'lambda:PutFunctionRecursionConfig';
    static readonly PutProvisionedConcurrencyConfig = 'lambda:PutProvisionedConcurrencyConfig';
    static readonly PutRuntimeManagementConfig = 'lambda:PutRuntimeManagementConfig';
    static readonly UpdateAlias = 'lambda:UpdateAlias';
    static readonly UpdateCodeSigningConfig = 'lambda:UpdateCodeSigningConfig';
    static readonly UpdateEventSourceMapping = 'lambda:UpdateEventSourceMapping';
    static readonly UpdateFunctionCode = 'lambda:UpdateFunctionCode';
    static readonly UpdateFunctionCodeSigningConfig = 'lambda:UpdateFunctionCodeSigningConfig';
    static readonly UpdateFunctionConfiguration = 'lambda:UpdateFunctionConfiguration';
    static readonly UpdateFunctionEventInvokeConfig = 'lambda:UpdateFunctionEventInvokeConfig';
    static readonly UpdateFunctionUrlConfig = 'lambda:UpdateFunctionUrlConfig';

    // permissions
    static readonly AddLayerVersionPermission = 'lambda:AddLayerVersionPermission';
    static readonly AddPermission = 'lambda:AddPermission';
    static readonly DisableReplication = 'lambda:DisableReplication';
    static readonly EnableReplication = 'lambda:EnableReplication';
    static readonly RemoveLayerVersionPermission = 'lambda:RemoveLayerVersionPermission';
    static readonly RemovePermission = 'lambda:RemovePermission';

    // tag actions
    static readonly TagResource = 'lambda:TagResource';
    static readonly UntagResource = 'lambda:UntagResource';
 
    // star actions
    static readonly AddAll = 'lambda:Add*';
    static readonly CreateAll = 'lambda:Create*';
    static readonly DeleteAll = 'lambda:Delete*';
    static readonly GetAll = 'lambda:Get*';
    static readonly InvokeAll = 'lambda:Invoke*';
    static readonly PublishAll = 'lambda:Publish*';
    static readonly ListAll = 'lambda:List*';
    static readonly PutAll = 'lambda:Put*';
    static readonly RemoveAll = 'lambda:Remove*';
    static readonly UpdateAll = 'lambda:Update*';
    static readonly All = 'lambda:*';

    static get ViewActions() {
      return [
        this.ListAll,
        this.GetAll,
      ];
    }

    static get WriteActions() {
      return [
        this.CreateAll,
        this.DeleteAll,
        this.InvokeAll,
        this.PublishAll,
        this.PutAll,
        this.UpdateAll
      ];
    }

    static get PermissionsActions() {
      return [
        this.AddAll,
        this.DisableReplication,
        this.EnableReplication,
        this.RemoveAll
      ]
    }

    static get TagActions() {
      return [
        this.TagResource,
        this.UntagResource
      ]
    }
}