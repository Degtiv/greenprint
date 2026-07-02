use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Clone)]
struct IPhoneSale {
    year: u16,
    sales: f64,
}

struct AppState {
    sales: Mutex<Vec<IPhoneSale>>,
}

#[tauri::command]
fn get_sales_data(state: State<AppState>) -> Vec<IPhoneSale> {
    state.sales.lock().unwrap().clone()
}

#[tauri::command]
fn add_sale(state: State<AppState>, year: u16, sales: f64) -> Vec<IPhoneSale> {
    let mut sales_data = state.sales.lock().unwrap();

    // Проверяем, существует ли уже запись за этот год
    if let Some(existing) = sales_data.iter_mut().find(|s| s.year == year) {
        existing.sales = sales;
    } else {
        sales_data.push(IPhoneSale { year, sales });
    }

    // Сортируем по году
    sales_data.sort_by_key(|s| s.year);

    sales_data.clone()
}

#[tauri::command]
fn delete_sale(state: State<AppState>, year: u16) -> Vec<IPhoneSale> {
    let mut sales_data = state.sales.lock().unwrap();
    sales_data.retain(|s| s.year != year);
    sales_data.clone()
}

#[tauri::command]
fn get_chart_info() -> String {
    String::from("Продажи iPhone по годам (млн. шт.)")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_data = vec![
        IPhoneSale { year: 2007, sales: 1.4 },
        IPhoneSale { year: 2008, sales: 11.6 },
        IPhoneSale { year: 2009, sales: 20.7 },
        IPhoneSale { year: 2010, sales: 39.9 },
        IPhoneSale { year: 2011, sales: 72.3 },
        IPhoneSale { year: 2012, sales: 125.0 },
        IPhoneSale { year: 2013, sales: 150.2 },
        IPhoneSale { year: 2014, sales: 169.2 },
        IPhoneSale { year: 2015, sales: 231.2 },
        IPhoneSale { year: 2016, sales: 211.8 },
        IPhoneSale { year: 2017, sales: 216.7 },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            sales: Mutex::new(initial_data),
        })
        .invoke_handler(tauri::generate_handler![
            get_sales_data,
            add_sale,
            delete_sale,
            get_chart_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}