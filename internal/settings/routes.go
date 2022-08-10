package settings

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/lncapital/torq/pkg/server_errors"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"
)

type settings struct {
	DefaultDateRange  string `json:"defaultDateRange" db:"default_date_range"`
	PreferredTimezone string `json:"preferredTimezone" db:"preferred_timezone"`
	WeekStartsOn      string `json:"weekStartsOn" db:"week_starts_on"`
}

type timeZone struct {
	Name string `json:"name" db:"name"`
}

func RegisterSettingRoutes(r *gin.RouterGroup, db *sqlx.DB, restartLNDSub func()) {
	r.GET("", func(c *gin.Context) { getSettingsHandler(c, db) })
	r.PUT("", func(c *gin.Context) { updateSettingsHandler(c, db) })
	r.GET("local-nodes", func(c *gin.Context) { getLocalNodesHandler(c, db) })
	r.GET("local-node/:nodeId", func(c *gin.Context) { getLocalNodeHandler(c, db) })
	r.PUT("local-node", func(c *gin.Context) { updateLocalNodeHandler(c, db, restartLNDSub) })
	r.PUT("local-node/:nodeId/set-enabled", func(c *gin.Context) { updateLocalNodeDisabledHandler(c, db, restartLNDSub) })
}
func RegisterUnauthenticatedRoutes(r *gin.RouterGroup, db *sqlx.DB) {
	r.GET("timezones", func(c *gin.Context) { getTimeZonesHandler(c, db) })
}

func getTimeZonesHandler(c *gin.Context, db *sqlx.DB) {
	timeZones, err := getTimeZones(db)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, timeZones)
}
func getSettingsHandler(c *gin.Context, db *sqlx.DB) {
	settings, err := getSettings(db)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, settings)
}

func updateSettingsHandler(c *gin.Context, db *sqlx.DB) {
	var settings settings
	if err := c.BindJSON(&settings); err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	err := updateSettings(db, settings)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, settings)
}

type localNode struct {
	LocalNodeId       int                   `json:"localNodeId" form:"localNodeId" db:"local_node_id"`
	Implementation    string                `json:"implementation" form:"implementation" db:"implementation"`
	GRPCAddress       *string               `json:"grpcAddress" form:"grpcAddress" db:"grpc_address"`
	TLSFileName       *string               `json:"tlsFileName" db:"tls_file_name"`
	TLSFile           *multipart.FileHeader `form:"tlsFile"`
	MacaroonFileName  *string               `json:"macaroonFileName" db:"macaroon_file_name"`
	MacaroonFile      *multipart.FileHeader `form:"macaroonFile"`
	CreateOn          time.Time             `json:"createdOn" db:"created_on"`
	UpdatedOn         *time.Time            `json:"updatedOn"  db:"updated_on"`
	TLSDataBytes      []byte                `db:"tls_data"`
	MacaroonDataBytes []byte                `db:"macaroon_data"`
	Disabled          bool                  `json:"disabled" db:"disabled"`
	Deleted           bool                  `json:"deleted" db:"deleted"`
}

func getLocalNodeHandler(c *gin.Context, db *sqlx.DB) {
	nodeId, err := strconv.Atoi(c.Param("nodeId"))
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	localNode, err := getLocalNode(db, nodeId)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, localNode)
}

func getLocalNodesHandler(c *gin.Context, db *sqlx.DB) {
	localNode, err := getLocalNodes(db)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, localNode)
}

func updateLocalNodeHandler(c *gin.Context, db *sqlx.DB, restartLNDSub func()) {
	var localNode localNode

	if err := c.Bind(&localNode); err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	localNode.LocalNodeId = 1

	err := updateLocalNodeDetails(db, localNode)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}

	if localNode.TLSFile != nil {
		localNode.TLSFileName = &localNode.TLSFile.Filename
		tlsDataFile, err := localNode.TLSFile.Open()
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
		tlsData, err := io.ReadAll(tlsDataFile)
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
		localNode.TLSDataBytes = tlsData

		err = updateLocalNodeTLS(db, localNode)
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
	}

	if localNode.MacaroonFile != nil {
		localNode.MacaroonFileName = &localNode.MacaroonFile.Filename
		macaroonDataFile, err := localNode.MacaroonFile.Open()
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
		macaroonData, err := io.ReadAll(macaroonDataFile)
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
		localNode.MacaroonDataBytes = macaroonData
		err = updateLocalNodeMacaroon(db, localNode)
		if err != nil {
			server_errors.LogAndSendServerError(c, err)
			return
		}
	}

	restartLNDSub()

	c.JSON(http.StatusOK, localNode)
}

type disabledJSON struct {
	Disabled bool `json:"disabled"`
}

func updateLocalNodeDisabledHandler(c *gin.Context, db *sqlx.DB, restartLNDSub func()) {
	var disabledJSON disabledJSON

	nodeId, err := strconv.Atoi(c.Param("nodeId"))
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}

	if err := c.Bind(&disabledJSON); err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}
	err = updateLocalNodeDisabledFlag(db, nodeId, disabledJSON.Disabled)
	if err != nil {
		server_errors.LogAndSendServerError(c, err)
		return
	}

	restartLNDSub()

	c.Status(http.StatusOK)
}
