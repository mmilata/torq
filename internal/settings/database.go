package settings

import (
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"

	"github.com/lncapital/torq/internal/database"
	"github.com/lncapital/torq/internal/nodes"
	"github.com/lncapital/torq/pkg/commons"
)

func getSettings(db *sqlx.DB) (settings, error) {
	var settingsData settings
	err := db.Get(&settingsData, `
		SELECT default_date_range, default_language, preferred_timezone, week_starts_on
		FROM settings
		LIMIT 1;`)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return settings{}, nil
		}
		return settings{}, errors.Wrap(err, database.SqlExecutionError)
	}
	return settingsData, nil
}

func InitializeManagedSettingsCache(db *sqlx.DB) error {
	settingsData, err := getSettings(db)
	if err == nil {
		log.Debug().Msg("Pushing settings to ManagedSettings cache.")
		commons.SetSettings(settingsData.DefaultDateRange, settingsData.DefaultLanguage, settingsData.WeekStartsOn,
			settingsData.PreferredTimezone)
	} else {
		log.Error().Err(err).Msg("Failed to obtain settings for ManagedSettings cache.")
	}
	return nil
}

func getTimeZones(db *sqlx.DB) (timeZones []timeZone, err error) {
	err = db.Select(&timeZones, "SELECT name FROM pg_timezone_names ORDER BY name;")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]timeZone, 0), nil
		}
		return nil, errors.Wrap(err, database.SqlExecutionError)
	}
	return timeZones, nil
}

func updateSettings(db *sqlx.DB, settings settings) (err error) {
	_, err = db.Exec(`
		UPDATE settings SET
		  default_date_range = $1,
		  default_language = $2,
		  preferred_timezone = $3,
		  week_starts_on = $4,
		  updated_on = $5;`,
		settings.DefaultDateRange, settings.DefaultLanguage, settings.PreferredTimezone, settings.WeekStartsOn,
		time.Now().UTC())
	if err != nil {
		return errors.Wrap(err, database.SqlExecutionError)
	}
	return nil
}

func getNodeConnectionDetails(db *sqlx.DB, nodeId int) (nodeConnectionDetails, error) {
	var nodeConnectionDetailsData nodeConnectionDetails
	err := db.Get(&nodeConnectionDetailsData, `SELECT * FROM node_connection_details WHERE node_id = $1;`, nodeId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nodeConnectionDetails{}, nil
		}
		return nodeConnectionDetails{}, errors.Wrap(err, database.SqlExecutionError)
	}
	return nodeConnectionDetailsData, nil
}
func getAllNodeConnectionDetails(db *sqlx.DB, includeDeleted bool) ([]nodeConnectionDetails, error) {
	var nodeConnectionDetailsArray []nodeConnectionDetails
	var err error
	if includeDeleted {
		err = db.Select(&nodeConnectionDetailsArray, `SELECT * FROM node_connection_details ORDER BY node_id;`)
	} else {
		err = db.Select(&nodeConnectionDetailsArray, `
			SELECT *
			FROM node_connection_details
			WHERE status_id != $1
			ORDER BY node_id;`, commons.Deleted)
	}
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []nodeConnectionDetails{}, nil
		}
		return nil, errors.Wrap(err, database.SqlExecutionError)
	}
	return nodeConnectionDetailsArray, nil
}

func InitializeManagedNodeCache(db *sqlx.DB) error {
	nodeConnectionDetailsArray, err := getAllNodeConnectionDetails(db, true)
	if err == nil {
		log.Debug().Msg("Pushing torq nodes to ManagedNodes cache.")
		for _, torqNode := range nodeConnectionDetailsArray {
			node, err := nodes.GetNodeById(db, torqNode.NodeId)
			if err == nil {
				if torqNode.Status == commons.Active {
					commons.SetActiveTorqNode(node.NodeId, node.PublicKey, node.Chain, node.Network)
				} else {
					commons.SetInactiveTorqNode(node.NodeId, node.PublicKey, node.Chain, node.Network)
				}
			} else {
				log.Error().Err(err).Msg("Failed to obtain torq node for ManagedNodes cache.")
			}
		}
	} else {
		log.Error().Err(err).Msg("Failed to obtain torq nodes for ManagedNodes cache.")
	}

	log.Debug().Msg("Pushing channel nodes to ManagedNodes cache.")
	rows, err := db.Query(`
		SELECT DISTINCT n.public_key, n.chain, n.network, n.node_id
		FROM node n
		JOIN channel c ON c.status_id IN ($1,$2,$3) AND ( c.first_node_id=n.node_id OR c.second_node_id=n.node_id );`,
		1, 2, 3)
	if err != nil {
		return errors.Wrap(err, "Obtaining nodeIds and publicKeys")
	}
	for rows.Next() {
		var publicKey string
		var nodeId int
		var chain commons.Chain
		var network commons.Network
		err = rows.Scan(&publicKey, &chain, &network, &nodeId)
		if err != nil {
			return errors.Wrap(err, "Obtaining nodeId and publicKey from the resultSet")
		}
		commons.SetChannelNode(nodeId, publicKey, chain, network)
	}
	return nil
}

func getNodeConnectionDetailsByStatus(db *sqlx.DB, status commons.Status) ([]nodeConnectionDetails, error) {
	var nodeConnectionDetailsArray []nodeConnectionDetails
	err := db.Select(&nodeConnectionDetailsArray, `
		SELECT * FROM node_connection_details WHERE status_id = $1 ORDER BY node_id;`, status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []nodeConnectionDetails{}, nil
		}
		return nil, errors.Wrap(err, database.SqlExecutionError)
	}
	return nodeConnectionDetailsArray, nil
}

func setNodeConnectionDetailsStatus(db *sqlx.DB, nodeId int, status commons.Status) error {
	_, err := db.Exec(`
		UPDATE node_connection_details SET status_id = $1, updated_on = $2 WHERE node_id = $3;`,
		status, time.Now().UTC(), nodeId)
	if err != nil {
		return errors.Wrap(err, database.SqlExecutionError)
	}
	return nil
}

func setNodeConnectionDetails(db *sqlx.DB, ncd nodeConnectionDetails) (nodeConnectionDetails, error) {
	updatedOn := time.Now().UTC()
	ncd.UpdatedOn = &updatedOn
	_, err := db.Exec(`
		UPDATE node_connection_details
		SET implementation = $1, name = $2, grpc_address = $3, tls_file_name = $4, tls_data = $5,
		    macaroon_file_name = $6, macaroon_data = $7, status_id = $8, updated_on = $9
		WHERE node_id = $10;`,
		ncd.Implementation, ncd.Name, ncd.GRPCAddress, ncd.TLSFileName, ncd.TLSDataBytes,
		ncd.MacaroonFileName, ncd.MacaroonDataBytes, ncd.Status, ncd.UpdatedOn, ncd.NodeId)
	if err != nil {
		return ncd, errors.Wrap(err, database.SqlExecutionError)
	}
	return ncd, nil
}

func SetNodeConnectionDetailsByConnectionDetails(
	db *sqlx.DB,
	nodeId int,
	grpcAddress string,
	tlsDataBytes []byte,
	macaroonDataBytes []byte) error {

	ncd, err := getNodeConnectionDetails(db, nodeId)
	if err != nil {
		return errors.Wrap(err, "Obtaining existing node connection details")
	}
	updatedOn := time.Now().UTC()
	ncd.UpdatedOn = &updatedOn
	ncd.MacaroonDataBytes = macaroonDataBytes
	ncd.TLSDataBytes = tlsDataBytes
	ncd.GRPCAddress = &grpcAddress
	_, err = setNodeConnectionDetails(db, ncd)
	return err
}

func setNodeConnectionDetailsName(db *sqlx.DB, nodeId int, name string) error {
	_, err := db.Exec(`
		UPDATE node_connection_details SET name = $1, updated_on = $2 WHERE node_id = $3;`,
		name, time.Now().UTC(), nodeId)
	if err != nil {
		return errors.Wrap(err, database.SqlExecutionError)
	}
	return nil
}

func addNodeConnectionDetails(db *sqlx.DB, ncd nodeConnectionDetails) (nodeConnectionDetails, error) {
	updatedOn := time.Now().UTC()
	ncd.UpdatedOn = &updatedOn
	_, err := db.Exec(`
		INSERT INTO node_connection_details
		    (node_id, name, implementation, grpc_address, tls_file_name, tls_data, macaroon_file_name, macaroon_data,
		     status_id, created_on, updated_on)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);`,
		ncd.NodeId, ncd.Name, ncd.Implementation, ncd.GRPCAddress, ncd.TLSFileName, ncd.TLSDataBytes,
		ncd.MacaroonFileName, ncd.MacaroonDataBytes, ncd.Status, ncd.CreateOn, ncd.UpdatedOn)
	if err != nil {
		return ncd, errors.Wrap(err, database.SqlExecutionError)
	}
	return ncd, nil
}
