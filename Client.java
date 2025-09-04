import java.io.*;
import java.net.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Scanner;

public class Client {

    public static void main(String[] args) {
        try {
            String timestamp = new SimpleDateFormat("HHmmssddMMyyyy").format(new Date());
            String logFileName = "client_" + timestamp + ".log";
            PrintWriter logWriter = new PrintWriter(new FileWriter(logFileName, true));
            Socket socket = new Socket("localhost", 1234);
            System.out.println("Connected to the chat server!");

            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

            new Thread(() -> {
                try {
                    String serverResponse;
                    while ((serverResponse = in.readLine()) != null) {
                        System.out.println(serverResponse);
                        logMessage(logWriter, serverResponse);
                    }
                } catch (IOException e) {
                    System.out.println(e);
                }
            }).start();

            Scanner scanner = new Scanner(System.in);
            String userInput;
            while (true) {
                userInput = scanner.nextLine();
                out.println(userInput);
            }
           
        } catch (IOException e) {
            System.out.println(e);
        }
    }

    private static void logMessage(PrintWriter logWriter, String message) {
        logWriter.println(message);
        logWriter.flush();
    }
}