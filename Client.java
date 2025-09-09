import java.io.*;
import java.net.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Scanner;

public class Client{
    static Encryption enc = new Encryption();
    static PrintWriter out;
    static BufferedReader in;
    public static void main(String[] args) {
        try {
            String timestamp = new SimpleDateFormat("HHmmssddMMyyyy").format(new Date());
            String logFileName = "client_" + timestamp + ".log";
            PrintWriter logWriter = new PrintWriter(new FileWriter(logFileName, true));
            Socket socket = new Socket("localhost", 1234);
            System.out.println("Connected to the chat server!");

            out = new PrintWriter(socket.getOutputStream(), true);
            in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            new Thread(() -> {
                try {
                    String serverResponse;
                    while ((serverResponse = in.readLine()) != null) {
<<<<<<< Updated upstream
                        System.out.println(serverResponse);
                        logMessage(logWriter, serverResponse);
=======
                        System.out.println(enc.unrotRev(serverResponse));
>>>>>>> Stashed changes
                    }
                } catch (IOException e) {
                    System.out.println(e);
                }
            }).start();

            Scanner scanner = new Scanner(System.in);
            String userInput;

            while (true) {
                userInput = scanner.nextLine();

                sendMessage(userInput);
            }
           
        } catch (IOException e) {
            System.out.println(e);
        }
    }
<<<<<<< Updated upstream

    private static void logMessage(PrintWriter logWriter, String message) {
        logWriter.println(message);
        logWriter.flush();
=======
        public static void sendMessage(String message) {
        Encryption enc = new Encryption();
        out.println(enc.rotRev(message));
>>>>>>> Stashed changes
    }
}