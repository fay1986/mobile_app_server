//
//  ShareViewController.m
//  shareTest
//
//  Created by Lokesh Patel on 27/10/15.
//
//

#import "ShareViewController.h"
#import <objc/runtime.h>
#import <MobileCoreServices/UTCoreTypes.h>

@interface ShareViewController ()
{
    NSString *userId;
    NSMutableArray *imagesAry;
    NSFileManager* fileMgr;
    NSString* filePath;
    NSString* docsPath;
    UIImageOrientation orientation;
    CGSize targetSize;
    NSInteger quality;
    NSInteger count;
}
@property (copy, nonatomic)NSMutableDictionary *entensionItems;
@property (strong, nonatomic)NSUserDefaults *mySharedDefults;

@end

static ShareViewController* shareVaribleHandle =nil;
@implementation ShareViewController
- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (id)init
{
    self = [super init];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

+ (void) setShareVaribleHandle:(ShareViewController *)responder{
    shareVaribleHandle = responder;
}

//Getter method
+ (ShareViewController*) getShareVaribleHandle {
    return shareVaribleHandle;
}

+ (void) shareResult:(NSString *)error Handle:(ShareViewController *)responder
{
    if ([error isEqualToString:@"取消"]) {
        
        [[NSNotificationCenter defaultCenter] postNotificationName:@"NSExtensionHostWillDismissViewController" object:nil];
        [responder.extensionContext completeRequestReturningItems:nil completionHandler:nil];
    }
    else if (error){
        
        if ([error isEqualToString:@"发表失败，请打开故事贴重试"]) {
            
            [responder.mySharedDefults setObject:responder.entensionItems forKey:@"shareExtensionItem"];
            
            [responder.mySharedDefults synchronize];
        }
        
        [responder showDialogWithMessage:error];
    }
    
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
    [_mySharedDefults setObject:self.entensionItems forKey:@"shareExtensionItem"];
    
    [_mySharedDefults synchronize];
    
    [self showDialogWithMessage:@"导入失败，请打开故事贴重新导入"];
}

-(void)showDialogWithMessage:(NSString *)message{
    
    [self.webView removeFromSuperview];
    
    //提示框
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"故事贴" message:message preferredStyle:UIAlertControllerStyleAlert];
    
    UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"我知道了" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        
        [[NSNotificationCenter defaultCenter] postNotificationName:@"NSExtensionHostWillDismissViewController" object:nil];
        [self.extensionContext completeRequestReturningItems:nil completionHandler:nil];
        
    }];
    
    [alertController addAction:okAction];
    
    [self presentViewController:alertController animated:YES completion:nil];
}

#pragma mark View lifecycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //数据共享
    if (!_mySharedDefults) {
        
        _mySharedDefults = [[NSUserDefaults alloc] initWithSuiteName:@"group.org.hotsharetest"];
    }
    
    userId = [_mySharedDefults objectForKey:@"userId"];
    
    if (!userId || [userId isEqualToString:@""]) {
        
        [self showDialogWithMessage:@"抱歉，请先打开故事贴，并登录，才可以使用分享功能。"];
        
    }
    else{
        
        [self.webView setFrame:CGRectMake(self.webView.bounds.origin.x,self.webView.bounds.origin.y + 20,self.webView.bounds.size.width,self.webView.bounds.size.height - 20)];
        self.webView.backgroundColor = [UIColor blackColor];
        [self fetchItemDataAtBackground];
        [ShareViewController setShareVaribleHandle:self];
    }
    if (![self.webView respondsToSelector:@selector(setKeyboardDisplayRequiresUserAction:)]) {
        
        [self keyboardDisplayDoesNotRequireUserAction];
    }
    
    
}
- (void) keyboardDisplayDoesNotRequireUserAction {
    SEL sel = sel_getUid("_startAssistingNode:userIsInteracting:blurPreviousNode:userObject:");
    Class WKContentView = NSClassFromString(@"WKContentView");
    Method method = class_getInstanceMethod(WKContentView, sel);
    IMP originalImp = method_getImplementation(method);
    IMP imp = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, id arg3) {
        ((void (*)(id, SEL, void*, BOOL, BOOL, id))originalImp)(me, sel, arg0, TRUE, arg2, arg3);
    });
    method_setImplementation(method, imp);
}

-(void)fetchItemDataAtBackground{
    
    if (!_entensionItems) {
        
        _entensionItems = [NSMutableDictionary new];
    }
    
    //后台获取
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSArray *inputItems = self.extensionContext.inputItems;
        NSExtensionItem *item = inputItems.firstObject;//无论多少数据，实际上只有一个 NSExtensionItem 对象
        count = item.attachments.count;
        for (NSItemProvider *provider in item.attachments) {
            //completionHandler 是异步运行的
            NSString *dataType = provider.registeredTypeIdentifiers.firstObject;//实际上一个NSItemProvider里也只有一种数据类型
            if ([dataType isEqualToString:@"public.png"]) {
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(UIImage *image, NSError *error){
                    //collect image...
                    
                    [self getImagePath:image];
                  
                    
                }];
            }else if ([dataType isEqualToString:@"public.jpeg"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(UIImage *image, NSError *error){
                    //collect image...
                    [self getImagePath:image];
                    
                }];
            }
            else if ([dataType isEqualToString:@"public.image"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(UIImage *image, NSError *error){
                    //collect image...
                    [self getImagePath:image];
                    
                }];
            }else if ([dataType isEqualToString:@"public.plain-text"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(NSString *contentText, NSError *error){
                    //collect image...
                    
                }];
            }else if ([dataType isEqualToString:@"public.url"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(NSURL *url, NSError *error){
                    //collect url...
                    if (error) {
                        NSLog(@"ERROR: %@", error);
                    }
                    [_entensionItems setObject:@"url" forKey:@"type"];
                    
                    [_entensionItems setObject:@[url.absoluteString] forKey:@"items"];
                    
                    [_mySharedDefults setObject:_entensionItems forKey:@"shareExtensionItem"];
                    
                    [_mySharedDefults synchronize];
                    
                    NSLog(@"entensionURL:%@", url);
                    
                }];
            }else if ([dataType isEqualToString:@"com.apple.property-list"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(id<NSSecureCoding> item, NSError *error){
                    //collect url...
                    if (error) {
                        NSLog(@"ERROR: %@", error);
                    }
                    NSDictionary *results = (NSDictionary *)item;
                    
                }];
            }else
                NSLog(@"don't support data type: %@", dataType);
        }
        
    });
    
    [self performSelector:@selector(returnToJavaScriptFunction) withObject:nil afterDelay:3.0];
}


-(void) returnToJavaScriptFunction
{
    NSString *scriptCall = [NSString stringWithFormat:@"Session.set('isShareExtension', true);"];
    
    [self.commandDelegate evalJs:scriptCall];
    
}

-(void)getImagePath:(UIImage *)image{
    int i;
    NSError* err = nil;
    if (!imagesAry) {
        imagesAry = [NSMutableArray new];
        fileMgr = [[NSFileManager alloc] init];
        docsPath  = [NSHomeDirectory()stringByAppendingPathComponent:@"Documents/"];
        orientation = UIImageOrientationUp;
        targetSize = CGSizeMake(1900, 1900);
        i = 1;
        quality = 20;
    }
    do {
        filePath = [NSString stringWithFormat:@"%@/%@%03d.%@", docsPath, @"cdv_photo_", i++, @"jpg"];
    } while ([fileMgr fileExistsAtPath:filePath]);
    
    UIImage* scaledImage = [self imageByScalingNotCroppingForSize:image toSize:targetSize];
    NSData* data = UIImageJPEGRepresentation(scaledImage, quality/100.0f);
    [data writeToFile:filePath options:NSAtomicWrite error:nil];
    if (![data writeToFile:filePath options:NSAtomicWrite error:&err]) {
        NSLog(@"[err localizedDescription]");
        
    } else {
       [imagesAry addObject:[[NSURL fileURLWithPath:filePath] absoluteString]];
    }
    if (imagesAry.count == count) {
        
        [_entensionItems setObject:@"image" forKey:@"type"];
        [_entensionItems setObject:imagesAry forKey:@"items"];
        [_mySharedDefults setObject:_entensionItems forKey:@"shareExtensionItem"];
        [_mySharedDefults synchronize];
        
        NSString *scriptCall = [NSString stringWithFormat:@"if(Session.get('shareExtensionItemIsNull')){checkShareExtension();}"];
        
        [self.commandDelegate evalJs:scriptCall];
    }

}

- (UIImage*)imageByScalingNotCroppingForSize:(UIImage*)anImage toSize:(CGSize)frameSize
{
    UIImage* sourceImage = anImage;
    UIImage* newImage = nil;
    CGSize imageSize = sourceImage.size;
    CGFloat width = imageSize.width;
    CGFloat height = imageSize.height;
    CGFloat targetWidth = frameSize.width;
    CGFloat targetHeight = frameSize.height;
    CGFloat scaleFactor = 0.0;
    CGSize scaledSize = frameSize;
    
    if (CGSizeEqualToSize(imageSize, frameSize) == NO) {
        CGFloat widthFactor = targetWidth / width;
        CGFloat heightFactor = targetHeight / height;
        
        // opposite comparison to imageByScalingAndCroppingForSize in order to contain the image within the given bounds
        if (widthFactor == 0.0) {
            scaleFactor = heightFactor;
        } else if (heightFactor == 0.0) {
            scaleFactor = widthFactor;
        } else if (widthFactor > heightFactor) {
            scaleFactor = heightFactor; // scale to fit height
        } else {
            scaleFactor = widthFactor; // scale to fit width
        }
        scaledSize = CGSizeMake(width * scaleFactor, height * scaleFactor);
    }
    
    UIGraphicsBeginImageContext(scaledSize); // this will resize
    
    [sourceImage drawInRect:CGRectMake(0, 0, scaledSize.width, scaledSize.height)];
    
    newImage = UIGraphicsGetImageFromCurrentImageContext();
    if (newImage == nil) {
        NSLog(@"could not scale image");
    }
    
    // pop the context to get back to the default
    UIGraphicsEndImageContext();
    return newImage;
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}


/* Comment out the block below to over-ride */

/*
 - (UIWebView*) newCordovaViewWithFrame:(CGRect)bounds
 {
 return[super newCordovaViewWithFrame:bounds];
 }
 */


@end

@implementation ShareViewCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
 in MainViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

- (NSString*)pathForResource:(NSString*)resourcepath
{
    return [super pathForResource:resourcepath];
}

@end

@implementation ShareViewCommandQueue

/* To override, uncomment the line in the init function(s)
 in MainViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end

