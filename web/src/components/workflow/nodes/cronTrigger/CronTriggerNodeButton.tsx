import { CalendarClock20Regular as CronTriggerIcon } from "@fluentui/react-icons";
import useTranslations from "services/i18n/useTranslations";
import WorkflowNodeButtonWrapper from "components/workflow/nodeButtonWrapper/NodeButtonWrapper";
import { WorkflowNodeType } from "pages/WorkflowPage/constants";
import { NodeColorVariant } from "../nodeVariants";

export function CronTriggerNodeButton() {
  const { t } = useTranslations();

  return (
    <WorkflowNodeButtonWrapper
      colorVariant={NodeColorVariant.accent2}
      nodeType={WorkflowNodeType.CronTrigger}
      icon={<CronTriggerIcon />}
      title={t.workflowNodes.cronTrigger}
      // parameters={"{0 23 ? * MON-FRI}"}
    />
  );
}
