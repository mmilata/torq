package lnd_connect

import (
	"context"
	"crypto/x509"
	"fmt"
	"github.com/lightningnetwork/lnd/macaroons"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/grpclog"
	"gopkg.in/macaroon.v2"
	"io"
	"os"
	"time"
)

// Connect connects to LND using gRPC.
func Connect(host string, tlsCert []byte, macaroonBytes []byte) (*grpc.ClientConn, error) {

	grpclog.SetLoggerV2(grpclog.NewLoggerV2(io.Discard, os.Stderr, os.Stderr))

	cp := x509.NewCertPool()
	if !cp.AppendCertsFromPEM(tlsCert) {
		return nil, fmt.Errorf("credentials: failed to append certificates")
	}
	tlsCreds := credentials.NewClientTLSFromCert(cp, "")

	mac := &macaroon.Macaroon{}
	if err := mac.UnmarshalBinary(macaroonBytes); err != nil {
		return nil, fmt.Errorf("cannot unmarshal macaroon: %v", err)
	}

	macCred, err := macaroons.NewMacaroonCredential(mac)
	if err != nil {
		return nil, fmt.Errorf("cannot create macaroon credentials: %v", err)
	}

	opts := []grpc.DialOption{
		grpc.WithReturnConnectionError(),
		grpc.FailOnNonTempDialError(true),
		grpc.WithBlock(),
		grpc.WithTransportCredentials(tlsCreds),
		grpc.WithPerRPCCredentials(macCred),
		// max size to 25mb
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(25 << (10 * 2))),
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*15)
	defer cancel()

	conn, err := grpc.DialContext(ctx, host, opts...)
	if err != nil {
		return nil, fmt.Errorf("cannot dial to lnd: %v", err)
	}

	return conn, nil
}
