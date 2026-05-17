package storage

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func UploadBytes(
	fileData []byte,
	contentType string,
	supabaseURL string,
	supabaseKey string,
	bucket string,
	remoteFilePath string,
) (string, error) {

	url := fmt.Sprintf(
		"%s/storage/v1/object/%s/%s",
		supabaseURL,
		bucket,
		remoteFilePath,
	)

	req, err := http.NewRequest(
		http.MethodPost,
		url,
		bytes.NewReader(fileData),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", contentType)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)

		return "", fmt.Errorf(
			"supabase upload failed: %s",
			string(body),
		)
	}

	publicURL := fmt.Sprintf(
		"%s/storage/v1/object/public/%s/%s",
		supabaseURL,
		bucket,
		remoteFilePath,
	)

	return publicURL, nil
}