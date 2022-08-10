import Box from "./Box";
import styles from "./NodeSettings.module.scss";
import Select, { SelectOption } from "../forms/Select";
import React, { useState } from "react";
import {
  Save20Regular as SaveIcon,
  PlugConnected20Regular as ConnectedIcon,
  PlugDisconnected20Regular as DisconnectedIcon,
  ChevronDown20Regular as ChevronIcon,
  MoreCircle20Regular as MoreIcon,
  Delete20Regular as DeleteIcon,
} from "@fluentui/react-icons";
import { toastCategory } from "../toast/Toasts";
import ToastContext from "../toast/context";
import File from "../forms/File";
import TextInput from "features/forms/TextInput";
import { useGetLocalNodeQuery, useUpdateLocalNodeMutation } from "apiSlice";
import { localNode } from "apiTypes";
import classNames from "classnames";
import Collapse from "features/collapse/Collapse";
import Switch from "features/inputs/Slider/Switch";
import Popover from "features/popover/Popover";
import Button, { buttonVariants } from "features/buttons/Button";
import Modal from "features/modal/Modal";

interface nodeProps {
  localNodeId: number;
}
function NodeSettings({ localNodeId }: nodeProps) {
  const toastRef = React.useContext(ToastContext);
  const popoverRef = React.useRef();

  const { data: localNodeData } = useGetLocalNodeQuery(localNodeId);
  const [updateLocalNode] = useUpdateLocalNodeMutation();

  const [localState, setLocalState] = useState({} as localNode);
  const [collapsedState, setCollapsedState] = useState(true);
  const [showModalState, setShowModalState] = useState(false);
  const [deleteConfirmationTextInputState, setDeleteConfirmationTextInputState] = useState("");
  const [deleteEnabled, setDeleteEnabled] = useState(false);

  const handleModalClose = () => {
    setShowModalState(false);
    setDeleteConfirmationTextInputState("");
    setDeleteEnabled(false);
  };

  const handleDeleteClick = () => {
    if (popoverRef.current) {
      (popoverRef.current as { close: Function }).close();
    }
    setShowModalState(true);
  };

  const submitNodeSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("implementation", "LND");
    form.append("grpcAddress", localState.grpcAddress ?? "");
    if (localState.tlsFile) {
      form.append("tlsFile", localState.tlsFile, localState.tlsFileName);
    }
    if (localState.macaroonFile) {
      form.append("macaroonFile", localState.macaroonFile, localState.macaroonFileName);
    }
    updateLocalNode(form);
    toastRef?.current?.addToast("Local node info saved", toastCategory.success);
  };

  React.useEffect(() => {
    if (localNodeData) {
      setLocalState(localNodeData);
    }
  }, [localNodeData]);

  const handleTLSFileChange = (file: File) => {
    setLocalState({ ...localState, tlsFile: file, tlsFileName: file ? file.name : undefined });
  };

  const handleMacaroonFileChange = (file: File) => {
    setLocalState({ ...localState, macaroonFile: file, macaroonFileName: file ? file.name : undefined });
  };

  const handleAddressChange = (value: string) => {
    setLocalState({ ...localState, grpcAddress: value });
  };

  const handleCollapseClick = () => {
    setCollapsedState(!collapsedState);
  };

  const handleModalDeleteClick = () => {
    setShowModalState(false);
    setDeleteConfirmationTextInputState("");
    setDeleteEnabled(false);
    // delete node!!!
  };

  const handleDeleteConfirmationTextInputChange = (value: string) => {
    setDeleteConfirmationTextInputState(value);
    setDeleteEnabled(value.toLowerCase() === "delete");
  };

  const implementationOptions = [{ value: "LND", label: "LND" } as SelectOption];

  const menuButton = <MoreIcon className={styles.moreIcon} />;
  return (
    <Box title="Node Settings">
      <>
        <div className={styles.header}>
          <div className={styles.connectionIcon}>
            <ConnectedIcon />
          </div>
          <div className={styles.title}>LN.Capital [1] LN Capital</div>
          <div className={classNames(styles.collapseIcon, { [styles.collapsed]: collapsedState })}>
            <ChevronIcon onClick={handleCollapseClick} />
          </div>
        </div>
        <Collapse collapsed={collapsedState}>
          <>
            <div className={styles.borderSection}>
              <Switch label={"Enable Node"} labelPosition={"left"} />
            </div>
            <div className={styles.borderSection}>
              <div className={styles.detailHeader}>
                <strong>Node Details</strong>
                <Popover button={menuButton} className={"right"} ref={popoverRef}>
                  <div style={{ padding: "10px" }}>
                    <Button
                      variant={buttonVariants.warning}
                      text={"Delete node"}
                      icon={<DeleteIcon />}
                      onClick={handleDeleteClick}
                    />
                  </div>
                </Popover>
              </div>
            </div>
            <div className={styles.borderSection}>
              <form onSubmit={submitNodeSettings}>
                <Select
                  label="Implementation"
                  onChange={() => {}}
                  options={implementationOptions}
                  value={implementationOptions.find((io) => io.value === localState?.implementation)}
                />
                <span id="address">
                  <TextInput
                    label="GRPC Address (IP or Tor)"
                    value={localState?.grpcAddress}
                    onChange={handleAddressChange}
                    placeholder="100.100.100.100:10009"
                  />
                </span>
                <span id="tls">
                  <File label="TLS Certificate" onFileChange={handleTLSFileChange} fileName={localState?.tlsFileName} />
                </span>
                <span id="macaroon">
                  <File
                    label="Macaroon"
                    onFileChange={handleMacaroonFileChange}
                    fileName={localState?.macaroonFileName}
                  />
                </span>
                <Button
                  variant={buttonVariants.secondary}
                  text={"Save node details"}
                  icon={<SaveIcon />}
                  submit={true}
                  fullWidth={true}
                />
              </form>
            </div>
          </>
        </Collapse>
        <Modal title={"Are you sure?"} icon={<DeleteIcon />} onClose={handleModalClose} show={showModalState}>
          <div className={styles.deleteConfirm}>
            <p>
              Deleting the node will prevent you from viewing it's data in Torq. Alternatively set node to disabled to
              simply stop the data subscription but keep data collected so far.
            </p>
            <p>
              This operation cannot be undone, type "<span className={styles.red}>delete</span>" to confirm.
            </p>

            <TextInput value={deleteConfirmationTextInputState} onChange={handleDeleteConfirmationTextInputChange} />
            <div className={styles.deleteConfirmButtons}>
              <a>Cancel</a>
              <Button
                variant={buttonVariants.warning}
                text={"Delete node"}
                icon={<DeleteIcon />}
                onClick={handleModalDeleteClick}
                disabled={!deleteEnabled}
              />
            </div>
          </div>
        </Modal>
      </>
    </Box>
  );
}
export default NodeSettings;
