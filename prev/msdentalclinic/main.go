package main

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/julienschmidt/httprouter"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func sendToTelegram(name, tel, source, page string) {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		botToken = "8600696729:AAHBhrnTUzRzOr7DEssWxO6-f0pWlEDrSnw"
	}

	chatIDs := []string{"219480233", "578319195"}

	sourceTag := ""
	if source == "implant_landing" {
		sourceTag = "\n🎯 *РЕКЛАМНА ЗАЯВКА (Імплантація)* 🎯"
	}

	if page == "" {
		page = "Невідомо"
	}

	loc, err := time.LoadLocation("Europe/Kiev")
	var timeStr string
	if err != nil {
		timeStr = time.Now().Format("15:04:05 02.01.2006")
	} else {
		timeStr = time.Now().In(loc).Format("15:04:05 02.01.2006")
	}

	message := fmt.Sprintf("🦷 *Нова заявка з сайту*%s\n\n👤 *Ім'я:* %s\n📞 *Телефон:* %s\n🌐 *Сторінка:* %s\n⏰ *Час:* %s", sourceTag, name, tel, page, timeStr)

	for _, chatID := range chatIDs {
		payload := map[string]interface{}{
			"chat_id":    chatID,
			"text":       message,
			"parse_mode": "Markdown",
		}
		jsonPayload, _ := json.Marshal(payload)

		url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
		go func(cid string, p []byte) {
			resp, err := http.Post(url, "application/json", bytes.NewBuffer(p))
			if err != nil {
				log.Printf("Failed to send telegram to %s: %v", cid, err)
				return
			}
			resp.Body.Close()
		}(chatID, jsonPayload)
	}
}

var isTLS = false

// CallMe struct represents the "callme" table structure
type CallMe struct {
	ID     int
	Name   string
	Tel    string
	Time   int64
	Source string
}

func createTable(db *sql.DB) error {
	// SQL statement to create the "callme" table with source field
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS callme (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		tel TEXT NOT NULL,
		time INTEGER NOT NULL,
		source TEXT NOT NULL DEFAULT 'main'
	);`

	_, err := db.Exec(createTableSQL)
	return err
}

// migrateTable adds the source column if it doesn't exist (for existing databases)
func migrateTable(db *sql.DB) error {
	// Check if source column exists
	rows, err := db.Query("PRAGMA table_info(callme)")
	if err != nil {
		return err
	}
	defer rows.Close()

	hasSource := false
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dflt interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dflt, &pk); err != nil {
			return err
		}
		if name == "source" {
			hasSource = true
		}
	}

	if !hasSource {
		_, err = db.Exec("ALTER TABLE callme ADD COLUMN source TEXT NOT NULL DEFAULT 'main'")
		if err != nil {
			return err
		}
		log.Println("Migration: added 'source' column to callme table")
	}
	return nil
}

func insertRecord(db *sql.DB, name, tel, source string) (int64, error) {
	// Get the current Unix timestamp
	currentTime := time.Now().Unix()

	// SQL statement to insert a record into the "callme" table
	insertSQL := "INSERT INTO callme(name, tel, time, source) VALUES (?, ?, ?, ?)"

	result, err := db.Exec(insertSQL, name, tel, currentTime, source)
	if err != nil {
		return 0, err
	}

	id, _ := result.LastInsertId()
	return id, nil
}

func getRecords(db *sql.DB) ([]CallMe, error) {
	// SQL statement to retrieve all records from the "callme" table
	query := "SELECT id, name, tel, time, source FROM callme ORDER BY time DESC"
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []CallMe
	for rows.Next() {
		var record CallMe
		err := rows.Scan(&record.ID, &record.Name, &record.Tel, &record.Time, &record.Source)
		if err != nil {
			return nil, err
		}
		records = append(records, record)
	}

	return records, nil
}

func deleteRecord(db *sql.DB, id int) error {
	// SQL statement to delete a record from the "callme" table
	deleteSQL := "DELETE FROM callme WHERE id=?"

	_, err := db.Exec(deleteSQL, id)
	return err
}

func databaseExists(dbFile string) bool {
	_, err := os.Stat(dbFile)
	return !os.IsNotExist(err)
}

// Function to format time as "hh:mm:DD/MM/YYYY"
func formatTime(unixTime int64) string {
	loc, err := time.LoadLocation("Europe/Kiev")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return ""
	}

	// Convert Unix timestamp to time in the specified location
	t := time.Unix(unixTime, 0).In(loc)
	return t.Format("15:04:05 02/01/2006")
}

// sourceLabel returns a human-readable label for a source
func sourceLabel(source string) string {
	switch source {
	case "implant_landing":
		return "🎯 Рекламна (імплантація)"
	case "main":
		return "🌐 Основний сайт"
	default:
		if source == "" {
			return "🌐 Основний сайт"
		}
		return source
	}
}

var templates = template.Must(template.New("").Funcs(template.FuncMap{
	"formatTime":  formatTime,
	"sourceLabel": sourceLabel,
}).ParseFiles("templates/crm/callme_table.html"))

func main() {
	dbFile := "db.sqlite"

	var db *sql.DB
	var err error

	// Check if the database file exists
	if !databaseExists(dbFile) {
		// Open or create the SQLite database
		db, err = sql.Open("sqlite3", dbFile)
		if err != nil {
			log.Fatal(err)
		}
		// Create the "callme" table
		err = createTable(db)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		// Open or create the SQLite database
		db, err = sql.Open("sqlite3", dbFile)
		if err != nil {
			log.Fatal(err)
		}
		// Run migrations for existing databases
		err = migrateTable(db)
		if err != nil {
			log.Fatal(err)
		}
	}

	defer db.Close()

	router := httprouter.New()

	router.ServeFiles("/static/*filepath", http.Dir("site/static"))

	// Serve static files for the root ("/") route
	router.GET("/", func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
		tmpl := template.Must(template.ParseFiles("site/index.html"))
		tmpl.Execute(w, nil)
	})

	// Serve the implant landing page at /implant
	router.GET("/implant", func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
		tmpl := template.Must(template.ParseFiles("site/implant.html"))
		tmpl.Execute(w, nil)
	})

	// Define routes
	router.GET("/crm", BasicAuth(func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if isTLS && r.TLS == nil {

			targetUrl := url.URL{Scheme: "https", Host: r.Host, Path: r.URL.Path, RawQuery: r.URL.RawQuery}
			http.Redirect(w, r, targetUrl.String(), 307)
			return
		}
		data, err := getRecords(db)
		if err != nil {
			w.Write([]byte(err.Error()))
			return
		}

		tmpl := template.Must(template.New("callme_table.html").Funcs(template.FuncMap{
			"formatTime":  formatTime,
			"sourceLabel": sourceLabel,
		}).ParseFiles("templates/crm/callme_table.html"))
		// Execute the template with the data
		err = tmpl.Execute(w, data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

	}))

	router.GET("/crm/delete/:id", BasicAuth(func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if isTLS && r.TLS == nil {

			targetUrl := url.URL{Scheme: "https", Host: r.Host, Path: r.URL.Path, RawQuery: r.URL.RawQuery}
			http.Redirect(w, r, targetUrl.String(), 307)
			return
		}
		// Get the ID parameter from the URL
		id := ps.ByName("id")
		if id == "" {
			http.Error(w, "Missing ID parameter", http.StatusBadRequest)
			return
		}

		// Convert the ID parameter to an integer
		recordID := 0
		fmt.Sscanf(id, "%d", &recordID)

		// Delete the record from the database
		err = deleteRecord(db, recordID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Redirect back to the index page after deletion
		http.Redirect(w, r, "/crm", http.StatusSeeOther)

	}))

	router.POST("/callme/", func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {

		type FormData struct {
			Name   string `json:"name"`
			Tel    string `json:"tel"`
			Source string `json:"source"`
			Page   string `json:"page"`
		}

		var formData FormData
		err := json.NewDecoder(r.Body).Decode(&formData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Default source to "main" if not provided
		if formData.Source == "" {
			formData.Source = "main"
		}
		
		if formData.Page == "" {
			formData.Page = "Невідомо"
		}

		_, err = insertRecord(db, formData.Name, formData.Tel, formData.Source)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Send to Telegram asynchronously
		go sendToTelegram(formData.Name, formData.Tel, formData.Source, formData.Page)

		// Optionally, you can send a response back to the client
		response := map[string]string{"message": "Form data received successfully"}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)

	})

	// Serve static files for the root ("/") route
	router.GET("/clearbasic", func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {

		http.Error(w, "logout complete", http.StatusUnauthorized)
	})

	fmt.Println("Server listening on :8080")
	panic(http.ListenAndServe(":8080", router))

}

func BasicAuth(h httprouter.Handle) httprouter.Handle {
	user := []byte("admin")
	pass := []byte("tempPass")
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		const basicAuthPrefix string = "Basic "
		auth := r.Header.Get("Authorization")
		if strings.HasPrefix(auth, basicAuthPrefix) {
			payload, err := base64.StdEncoding.DecodeString(auth[len(basicAuthPrefix):])
			if err == nil {
				pair := bytes.SplitN(payload, []byte(":"), 2)
				if len(pair) == 2 &&
					bytes.Equal(pair[0], user) &&
					bytes.Equal(pair[1], pass) {
					h(w, r, ps)
					return
				}
			}
		}
		w.Header().Set("WWW-Authenticate", "Basic realm=Restricted")
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
	}
}
