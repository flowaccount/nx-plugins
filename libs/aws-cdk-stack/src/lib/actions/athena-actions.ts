export class AthenaActions {
  // list actions
  static readonly ListApplicationDPUSizes = 'athena:ListApplicationDPUSizes';
  static readonly ListCalculationExecutions =
    'athena:ListCalculationExecutions';
  static readonly ListCapacityReservations = 'athena:ListCapacityReservations';
  static readonly ListDatabases = 'athena:ListDatabases';
  static readonly ListDataCatalogs = 'athena:ListDataCatalogs';
  static readonly ListExecutors = 'athena:ListExecutors';
  static readonly ListNamedQueries = 'athena:ListNamedQueries';
  static readonly ListNotebookMetadata = 'athena:ListNotebookMetadata';
  static readonly ListNotebookSessions = 'athena:ListNotebookSessions';
  static readonly ListPreparedStatements = 'athena:ListPreparedStatements';
  static readonly ListSessions = 'athena:ListSessions';
  static readonly ListWorkGroups = 'athena:ListWorkGroups';

  // read actions
  static readonly BatchGetNamedQuery = 'athena:BatchGetNamedQuery';
  static readonly BatchGetPreparedStatement =
    'athena:BatchGetPreparedStatement';
  static readonly BatchGetQueryExecution = 'athena:BatchGetQueryExecution';
  static readonly GetCalculationExecution = 'athena:GetCalculationExecution';
  static readonly GetCalculationExecutionCode =
    'athena:GetCalculationExecutionCode';
  static readonly GetCalculationExecutionStatus =
    'athena:GetCalculationExecutionStatus';
  static readonly GetCapacityAssignmentConfiguration =
    'athena:GetCapacityAssignmentConfiguration';
  static readonly GetCapacityReservation = 'athena:GetCapacityReservation';
  static readonly GetCatalogs = 'athena:GetCatalogs';
  static readonly GetDatabase = 'athena:GetDatabase';
  static readonly GetDataCatalog = 'athena:GetDataCatalog';
  static readonly GetExecutionEngine = 'athena:GetExecutionEngine';
  static readonly GetExecutionEngines = 'athena:GetExecutionEngines';
  static readonly GetNamedQuery = 'athena:GetNamedQuery';
  static readonly GetNamespace = 'athena:GetNamespace';
  static readonly GetNamespaces = 'athena:GetNamespaces';
  static readonly GetNotebookMetadata = 'athena:GetNotebookMetadata';
  static readonly GetPreparedStatement = 'athena:GetPreparedStatement';
  static readonly GetQueryExecution = 'athena:GetQueryExecution';
  static readonly GetQueryExecutions = 'athena:GetQueryExecutions';
  static readonly GetQueryResults = 'athena:GetQueryResults';
  static readonly GetQueryResultsStream = 'athena:GetQueryResultsStream';
  static readonly GetQueryRuntimeStatistics =
    'athena:GetQueryRuntimeStatistics';
  static readonly GetSession = 'athena:GetSession';
  static readonly GetSessionStatus = 'athena:GetSessionStatus';
  static readonly GetTable = 'athena:GetTable';
  static readonly GetTables = 'athena:GetTables';
  static readonly GetTableMetadata = 'athena:GetTableMetadata';
  static readonly GetWorkGroup = 'athena:GetWorkGroup';
  static readonly ListEngineVersions = 'athena:ListEngineVersions';
  static readonly ListQueryExecutions = 'athena:ListQueryExecutions';
  static readonly ListTableMetadata = 'athena:ListTableMetadata';
  static readonly ListTagsForResource = 'athena:ListTagsForResource';

  // write actions
  static readonly CancelCapacityReservation =
    'athena:CancelCapacityReservation';
  static readonly CancelQueryExecution = 'athena:CancelQueryExecution';
  static readonly CreateCapacityReservation =
    'athena:CreateCapacityReservation';
  static readonly CreateDataCatalog = 'athena:CreateDataCatalog';
  static readonly CreateNamedQuery = 'athena:CreateNamedQuery';
  static readonly CreateNotebook = 'athena:CreateNotebook';
  static readonly CreatePreparedStatement = 'athena:CreatePreparedStatement';
  static readonly CreatePresignedNotebookUrl =
    'athena:CreatePresignedNotebookUrl';
  static readonly CreateWorkGroup = 'athena:CreateWorkGroup';
  static readonly DeleteCapacityReservation =
    'athena:DeleteCapacityReservation';
  static readonly DeleteDataCatalog = 'athena:DeleteDataCatalog';
  static readonly DeleteNamedQuery = 'athena:DeleteNamedQuery';
  static readonly DeleteNotebook = 'athena:DeleteNotebook';
  static readonly DeletePreparedStatement = 'athena:DeletePreparedStatement';
  static readonly DeleteWorkGroup = 'athena:DeleteWorkGroup';
  static readonly ExportNotebook = 'athena:ExportNotebook';
  static readonly ImportNotebook = 'athena:ImportNotebook';
  static readonly PutCapacityAssignmentConfiguration =
    'athena:PutCapacityAssignmentConfiguration';
  static readonly RunQuery = 'athena:RunQuery';
  static readonly StartCalculationExecution =
    'athena:StartCalculationExecution';
  static readonly StartQueryExecution = 'athena:StartQueryExecution';
  static readonly StartSession = 'athena:StartSession';
  static readonly StopCalculationExecution = 'athena:StopCalculationExecution';
  static readonly StopQueryExecution = 'athena:StopQueryExecution';
  static readonly TerminateSession = 'athena:TerminateSession';
  static readonly UpdateCapacityReservation =
    'athena:UpdateCapacityReservation';
  static readonly UpdateDataCatalog = 'athena:UpdateDataCatalog';
  static readonly UpdateNamedQuery = 'athena:UpdateNamedQuery';
  static readonly UpdateNotebook = 'athena:UpdateNotebook';
  static readonly UpdateNotebookMetadata = 'athena:UpdateNotebookMetadata';
  static readonly UpdatePreparedStatement = 'athena:UpdatePreparedStatement';
  static readonly UpdateWorkGroup = 'athena:UpdateWorkGroup';

  // tag actions
  static readonly TagResource = 'athena:TagResource';
  static readonly UntagResource = 'athena:UntagResource';

  // start actions
  static readonly ListAll = 'athena:List*';
  static readonly GetAll = 'athena:Get*';
  static readonly CancelAll = 'athena:Cancel*';
  static readonly CreateAll = 'athena:Create*';
  static readonly DeleteAll = 'athena:Delete*';
  static readonly StartAll = 'athena:Start*';
  static readonly StopAll = 'athena:Stop*';
  static readonly UpdateAll = 'athena:Update*';
}
