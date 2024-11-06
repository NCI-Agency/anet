import AttachmentPreview from "./AttachmentPreview"
import AuthorizationGroupPreview from "./AuthorizationGroupPreview"
import LocationPreview from "./LocationPreview"
import OrganizationPreview from "./OrganizationPreview"
import PersonPreview from "./PersonPreview"
import PositionPreview from "./PositionPreview"
import { registerPreviewComponent } from "./PreviewComponentFactory"
import ReportPreview from "./ReportPreview"
import TaskPreview from "./TaskPreview"

registerPreviewComponent("Attachment", AttachmentPreview)
registerPreviewComponent("AuthorizationGroup", AuthorizationGroupPreview)
registerPreviewComponent("Location", LocationPreview)
registerPreviewComponent("Organization", OrganizationPreview)
registerPreviewComponent("Person", PersonPreview)
registerPreviewComponent("Position", PositionPreview)
registerPreviewComponent("Report", ReportPreview)
registerPreviewComponent("Task", TaskPreview)
